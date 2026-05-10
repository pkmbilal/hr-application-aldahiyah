export const PASSWORD_RULES = [
  {
    id: "minLength",
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "At least one capital letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    label: "At least one small letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "At least one number",
    test: (password) => /[0-9]/.test(password),
  },
  {
    id: "special",
    label: "At least one special sign",
    test: (password) => /[^A-Za-z0-9\s]/.test(password),
  },
];

export function validatePasswordRules(password) {
  return PASSWORD_RULES.map((rule) => ({
    ...rule,
    met: rule.test(password),
  }));
}

export function getPasswordRuleError(password) {
  const failedRules = validatePasswordRules(password).filter((rule) => !rule.met);

  if (!failedRules.length) {
    return null;
  }

  return `New password must include: ${failedRules.map((rule) => rule.label.toLowerCase()).join(", ")}.`;
}
