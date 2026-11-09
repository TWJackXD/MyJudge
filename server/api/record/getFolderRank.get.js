import { supabase } from '~/server/utils/supabase'
import { canAccessProblem, canUserSeeFolder } from '~/utils/problemVisibility'

export default defineEventHandler(async (event) => {
  const { folder } = getQuery(event)

  if (!folder) {
    throw createError({ statusCode: 400, statusMessage: '必須提供 folder 參數' })
  }

  const user = event.context.user || null

  const { data: folderAccessRows, error: folderAccessError } = await supabase
    .from('folders')
    .select('*')
    .eq('uuid', folder)
    .limit(1)

  if (folderAccessError) throw folderAccessError

  const folderRecord = folderAccessRows?.[0]
  if (!folderRecord) {
    throw createError({ statusCode: 404, statusMessage: '找不到指定的競賽' })
  }

  if (!canUserSeeFolder(folderRecord, user)) {
    throw createError({ statusCode: 403, statusMessage: '你沒有權限查看此競賽排名' })
  }

  // 取得此競賽下的所有題目（依題號排序）
  const { data: allLinks, error: problemsError } = await supabase
    .from('folder_problems')
    .select('question_no, problems(uuid, visibility, visibility_users)')
    .eq('folder', folder)
    .order('question_no', { ascending: true })

  if (problemsError) throw problemsError

  const problems = (allLinks || [])
    .filter((link) => link.problems)
    .filter((link) => canAccessProblem(link.problems, folderRecord, user))
    .map((link) => ({
      uuid: link.problems.uuid,
      question_no: link.question_no,
      visibility: link.problems.visibility,
      visibility_users: link.problems.visibility_users
    }))

  if (!problems || problems.length === 0) {
    return { status: 'success', data: [] }
  }

  const problemUuidList = problems.map(p => p.uuid)

  // 只取「此競賽」的提交紀錄（同題在其他競賽的提交不計入）
  const { data: records, error: recordsError } = await supabase
    .from('record')
    .select('solver, problem, status, created_at')
    .eq('folder', folder)
    .in('problem', problemUuidList)

  if (recordsError) throw recordsError

  if (!records || records.length === 0) {
    return { status: 'success', data: [] }
  }

  // 取得參與者資訊
  const solverIds = [...new Set(records.map(r => r.solver))]

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, username, role')
    .in('id', solverIds)

  if (usersError) throw usersError

  const userById = new Map(users.map(u => [u.id, u]))
  const adminIds = new Set(users.filter(u => u.role === 'admin').map(u => u.id))

  // 建立題目索引與題號顯示
  const problemIndexByUuid = new Map()
  const questionLabelByUuid = new Map()
  const problemStartAtByUuid = new Map()

  const folderStartTime = folderRecord.start_time || null

  problems.forEach((p, idx) => {
    problemIndexByUuid.set(p.uuid, idx)
    const padded = String(p.question_no).padStart(2, '0')
    questionLabelByUuid.set(p.uuid, `q${padded}`)
    if (folderStartTime) {
      problemStartAtByUuid.set(p.uuid, folderStartTime)
    }
  })

  // 依使用者彙總
  const rows = new Map()

  for (const rec of records) {
    const { solver, problem, status, created_at } = rec
    // 管理員的提交只用於測試，不計入排名
    if (adminIds.has(solver)) continue
    // 不計入 SAVE 狀態的紀錄
    if (status === 'SAVE') continue
    if (!rows.has(solver)) {
      rows.set(solver, {
        solver,
        account: userById.get(solver)?.username || String(solver),
        name: userById.get(solver)?.username || String(solver),
        // 題目錯誤次數與完成時間計算資料
        perProblem: problems.map(() => ({ errors: 0, submissions: 0, firstAcAt: null, hasAc: false, acTimes: [] })),
        totalSubmissions: 0,
        correctCount: 0,
        avgMinutesPerSolved: 0,
      })
    }
    const row = rows.get(solver)

    const idx = problemIndexByUuid.get(problem)
    if (idx === undefined) continue

    row.perProblem[idx].submissions += 1
    row.totalSubmissions += 1

    if (status === 'AC') {
      row.perProblem[idx].hasAc = true
      const t = created_at ? new Date(created_at).getTime() : null
      if (t !== null && row.perProblem[idx].firstAcAt === null) {
        row.perProblem[idx].firstAcAt = t
      }
      if (t !== null) {
        row.perProblem[idx].acTimes.push(t)
      }
    } else {
      row.perProblem[idx].errors += 1
    }
  }

  // 計算每位使用者的正確題數與平均完成時間（分鐘）
  for (const row of rows.values()) {
    let totalMinutes = 0
    let solvedCount = 0
    row.perProblem.forEach((pp, idx) => {
      if (!pp.hasAc) return
      const problemUuid = problems[idx].uuid
      const startAt = problemStartAtByUuid.get(problemUuid)
      const startMs = startAt ? new Date(startAt).getTime() : null
      if (startMs === null) {
        // 若缺少起始時間，視為 0 分鐘，但仍列為已解出
        solvedCount += 1
        return
      }
      // 只計算 AC 紀錄的平均（忽略非 AC），NULL 時間略過
      const validDiffs = (pp.acTimes || [])
        .map(t => Math.max(0, Math.round((t - startMs) / 60000)))
        .filter(v => Number.isFinite(v))
      if (validDiffs.length > 0) {
        const sum = validDiffs.reduce((a, b) => a + b, 0)
        const avg = Math.round(sum / validDiffs.length)
        totalMinutes += avg
      }
      solvedCount += 1
    })
    row.correctCount = solvedCount
    row.avgMinutesPerSolved = solvedCount > 0 ? Math.round(totalMinutes / solvedCount) : 0
  }

  // 產生輸出格式
  const data = Array.from(rows.values()).map(row => {
    const problemStats = row.perProblem
      .map((pp, idx) => ({ pp, idx }))
      // 僅顯示有提交過的題目（submissions > 0）
      .filter(({ pp }) => (pp.submissions || 0) > 0)
      .map(({ pp, idx }) => {
        const qLabel = questionLabelByUuid.get(problems[idx].uuid)
        const isAc = !!pp.hasAc
        return {
          text: `${qLabel}[${pp.errors}]`,
          isAc: isAc
        }
      })

    return {
      account: row.account,
      name: row.name,
      class: 'A',
      problemStats, // 陣列，包含 { text, isAc }
      avgMinutesPerSolved: row.avgMinutesPerSolved,
      correctOverTotal: `${row.correctCount}/${row.totalSubmissions}`,
      correctCount: row.correctCount,
      totalSubmissions: row.totalSubmissions,
    }
  })

  // 排名規則：正確題數多者優先，其次平均用時少者，再次提交總數少者
  data.sort((a, b) => {
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount
    if (a.avgMinutesPerSolved !== b.avgMinutesPerSolved) return a.avgMinutesPerSolved - b.avgMinutesPerSolved
    return a.totalSubmissions - b.totalSubmissions
  })

  // 加上排名序號
  const ranked = data.map((d, i) => ({
    rank: i + 1,
    account: d.account,
    name: d.name,
    class: d.class,
    problemStats: d.problemStats,
    avgMinutesPerSolved: d.avgMinutesPerSolved,
    correctOverTotal: d.correctOverTotal,
    correctCount: d.correctCount,
    totalSubmissions: d.totalSubmissions,
  }))

  return { status: 'success', data: ranked }
})