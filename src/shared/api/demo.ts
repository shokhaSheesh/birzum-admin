/**
 * The sample panel ("API ulanmagan — namuna"): the same panel with every page, but `api()` answers
 * from an in-browser sample backend (`mock/`) instead of the staging API. Kept for this tab.
 */
const KEY = 'birzum-admin.demo'

function read() {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

let demo = read()

export const isDemo = () => demo

export function setDemo(on: boolean) {
  demo = on
  try {
    if (on) sessionStorage.setItem(KEY, '1')
    else sessionStorage.removeItem(KEY)
  } catch {
    // Private mode: the sample panel lasts until the page is reloaded
  }
}
