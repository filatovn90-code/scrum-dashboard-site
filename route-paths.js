function isFilePreview() {
  return window.location.protocol === "file:";
}

function isNestedFileRoute(path) {
  return ["/login/", "/signup/", "/forgot-password/", "/onboarding/", "/pricing/", "/app/", "/profile/"].some((segment) => path.includes(segment));
}

export function rootPrefix() {
  if (!isFilePreview()) {
    return "/";
  }

  const path = window.location.pathname.replace(/\\/g, "/");
  return isNestedFileRoute(path) ? "../" : "";
}

export function landingPath() {
  return isFilePreview() ? `${rootPrefix()}index.html` : "/";
}

export function loginPath() {
  return isFilePreview() ? `${rootPrefix()}login.html` : "/login";
}

export function signupPath() {
  return isFilePreview() ? `${rootPrefix()}signup.html` : "/signup";
}

export function forgotPasswordPath() {
  return isFilePreview() ? `${rootPrefix()}forgot-password.html` : "/forgot-password";
}

export function onboardingPath() {
  return isFilePreview() ? `${rootPrefix()}onboarding.html` : "/onboarding";
}

export function pricingPath() {
  return isFilePreview() ? `${rootPrefix()}pricing.html` : "/pricing";
}

export function todayPath() {
  return isFilePreview() ? `${rootPrefix()}today.html` : "/today.html";
}

export function backlogPath() {
  return isFilePreview() ? `${rootPrefix()}backlog.html` : "/backlog.html";
}

export function analyticsPath() {
  return isFilePreview() ? `${rootPrefix()}analytics.html` : "/analytics.html";
}

export function appPath() {
  return backlogPath();
}

export function profilePath() {
  return isFilePreview() ? `${rootPrefix()}profile.html` : "/profile";
}

export function billingPath() {
  return isFilePreview() ? `${rootPrefix()}billing.html` : "/billing.html";
}

export function settingsPath() {
  return isFilePreview() ? `${rootPrefix()}settings.html` : "/settings.html";
}

export function helpPath() {
  return isFilePreview() ? `${rootPrefix()}help.html` : "/help.html";
}

export function featuresPath() {
  return `${landingPath()}#features`;
}

export function howItWorksPath() {
  return `${landingPath()}#how-it-works`;
}

export function rootFile(fileName) {
  return isFilePreview() ? `${rootPrefix()}${fileName}` : `/${String(fileName || "").replace(/^\/+/, "")}`;
}
