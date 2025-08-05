// Final test for pre-commit hook
const testVar = "hello world"
let unusedVar = "this should trigger warning"

export function testHook() {
  return testVar
}
