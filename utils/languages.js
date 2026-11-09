export const SUPPORTED_LANGUAGES = ['Java', 'Python', 'C++', 'C#'];

// Judge0 CE（RapidAPI）語言編號
export const JUDGE0_LANGUAGE_IDS = {
  Java: 62,
  Python: 71,
  'C++': 54,
  'C#': 51,
};

export const MONACO_LANGUAGE_IDS = {
  Java: 'java',
  Python: 'python',
  'C++': 'cpp',
  'C#': 'csharp',
};

export const BOILERPLATE_CODE = {
  Java: 'public class Main {\n  public static void main(String[] args) {\n    \n  }\n}',
  Python: '',
  'C++': '#include <iostream>\n\nint main() {\n    // Your code here\n    return 0;\n}',
  'C#': 'using System;\n\nclass Program\n{\n    static void Main(string[] args)\n    {\n        \n    }\n}',
};

export function parseAllowedLanguages(value) {
  try {
    let languages = value;
    if (typeof value === 'string' && value.trim()) {
      languages = JSON.parse(value);
    }
    if (!Array.isArray(languages) || languages.length === 0) {
      return [...SUPPORTED_LANGUAGES];
    }
    const supported = languages.filter((lang) => SUPPORTED_LANGUAGES.includes(lang));
    return supported.length > 0 ? supported : [...SUPPORTED_LANGUAGES];
  } catch {
    return [...SUPPORTED_LANGUAGES];
  }
}
