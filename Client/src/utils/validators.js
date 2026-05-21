export const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validatePassword = (password) => password.length >= 6;

export const validateRequired = (value) =>
  value && value.trim().length > 0;

export const validatePhone = (phone) =>
  /^[0-9]{10}$/.test(phone);

export const validateAmount = (amt) => amt > 0;
