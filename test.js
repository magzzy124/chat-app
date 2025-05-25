let x = 0;
let xyx;
async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function increment() {
  let y = x;
  await delay(100);
  console.log(2);
  x = y + 1;
}
increment();
console.log(1);
increment();
increment();
console.log(1);
increment();
console.log(1);

console.log(x);
