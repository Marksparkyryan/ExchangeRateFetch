const currencyElementOne = document.getElementById('currency-one');
const amountElementOne = document.getElementById('amount-one');
const currencyElementTwo = document.getElementById('currency-two');
const amountElementTwo = document.getElementById('amount-two');
const rateElement = document.getElementById('rate');
const swapButton = document.getElementById('swap');
const updated = document.getElementById('updated');
const delta = 60000;

function renderOptionsLists() {
  let list = JSON.parse(localStorage.getItem("data"));
  let options = Object.keys(list.rates).map(code => {
    return `<option value="${code}">${code}</option>`;
  })
  currencyElementOne.innerHTML = options;
  currencyElementTwo.innerHTML = options;
}

// Fetch json data from api resource with base currency
function fetchData() {
  let now = new Date().getTime();
  const currencyOneValue = currencyElementOne.value;
  
  console.log(`fetching ${currencyElementOne.value} from api.exchangeratesapi.io`)
  fetch(`https://api.exchangeratesapi.io/latest?base=${currencyOneValue}`)
    .then(res => res.json())
    .then(myJson => {
      localStorage.setItem("data", JSON.stringify(myJson));
      localStorage.setItem("timestamp", now+delta);
    })
    .then(calculate)
}

// Try to get data from cache, update data in cache if need be
function getDataFromStorage() {
  let now = new Date().getTime();
  if (localStorage.getItem("timestamp") < now) {
      fetchData();
    } else {
      console.log(`fetching ${currencyElementTwo.value} from local storage`)
    }
  return JSON.parse(localStorage.getItem("data")); 
  }

// Get exchange rate and render currency values
function calculate() {
  let now = new Date().getTime();
  const currencyOneValue = currencyElementOne.value;
  const currencyTwoValue = currencyElementTwo.value;
  let rate = getDataFromStorage().rates[currencyTwoValue];

  console.log("calculating...");
  rateElement.innerText = `1 ${currencyOneValue} = ${rate} ${currencyTwoValue}`;
  amountElementTwo.value = (amountElementOne.value * rate).toFixed(2);
  let time = localStorage.getItem("timestamp") - delta
  updated.innerText = `rates updated ${(now - time)/1000} seconds ago`;
  console.log("done")
}

// Swap currency codes
function swap() {
  console.log("swapping")
  const temp = currencyElementOne.value;
  currencyElementOne.value = currencyElementTwo.value;
  currencyElementTwo.value = temp;
}

renderOptionsLists()
calculate()

// Event listeners
currencyElementOne.addEventListener('change', () => {
  fetchData();
});
amountElementOne.addEventListener('input', calculate);
currencyElementTwo.addEventListener('change', calculate);
amountElementTwo.addEventListener('input', calculate);
swapButton.addEventListener('click', () => {
  swap();
  fetchData();
});
