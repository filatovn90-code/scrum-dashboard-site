function isNestedRoute(path) {
  return ["/login/", "/signup/", "/forgot-password/", "/app/", "/profile/"].some((segment) => path.includes(segment));
}

export function rootPrefix() {
  const path = window.location.pathname.replace(/\\/g, "/");
  return isNestedRoute(path) ? "../" : "";
}

export function landingPath() {
  return `${rootPrefix()}index.html`;
}

export function loginPath() {
  return `${rootPrefix()}login.html`;
}

export function signupPath() {
  return `${rootPrefix()}signup.html`;
}

export function forgotPasswordPath() {
  return `${rootPrefix()}forgot-password.html`;
}

export function todayPath() {
  return `${rootPrefix()}today.html`;
}

export function appPath() {
  return todayPath();
}

export function profilePath() {
  return `${rootPrefix()}profile.html`;
}

export function rootFile(fileName) {
  return `${rootPrefix()}${fileName}`;
}
