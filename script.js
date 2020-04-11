const currencyElementOne = document.getElementById('currency-one');
const amountElementOne = document.getElementById('amount-one');
const currencyElementTwo = document.getElementById('currency-two');
const amountElementTwo = document.getElementById('amount-two');
const rateElement = document.getElementById('rate');
const swapButton = document.getElementById('swap');
const updated = document.getElementById('updated');
const delta = 60000;
let today = new Date();
let now = new Date().getTime();

// Render options of select lists
function renderOptionsLists() {
  let list = getDataFromStorage();
  let options = Object.keys(list.rates).map(code => {
    return `<option value="${code}">${code}</option>`;
  })
  currencyElementOne.innerHTML = options;
  currencyElementTwo.innerHTML = options;
}

// Get date ranges for chart data
const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate()
const addMonths = (input, months) => {
  const date = new Date(input)
  date.setDate(1)
  date.setMonth(date.getMonth() + months)
  date.setDate(Math.min(input.getDate(), getDaysInMonth(date.getFullYear(), date.getMonth()+1)))
  return date.toISOString().slice(0,10);
}

// Fetch chart json data
function fetchChartData() {
  console.log(`fetching ${currencyElementOne.value} chart data from api.exchangeratesapi.io`)
  const start = addMonths(today, -9);
  const end = addMonths(today, 0);
  fetch(`https://api.exchangeratesapi.io/history?start_at=${start}&end_at=${end}&base=${currencyElementOne.value}`)
    .then(res => res.json())
    .then(chartJson => {
      localStorage.setItem(`${currencyElementOne.value}ChartData`, JSON.stringify(chartJson));
      localStorage.setItem(`${currencyElementOne.value}ChartTimestamp`, today);
    })
    .then(console.log(`finished writing ${currencyElementOne.value} chart data to local`))
}

// Fetch json data from api resource with base currency
const fetchData = () => fetch(`https://api.exchangeratesapi.io/latest?base=${currencyElementOne.value}`)
    .then(res => res.json())
    .then(myJson => {
      localStorage.setItem(`${currencyElementOne.value}Data`, JSON.stringify(myJson));
      localStorage.setItem(`${currencyElementOne.value}Timestamp`, now+delta);
    })
    .then(console.log(`finished writing ${currencyElementOne.value} number data to local`))

// Try to get data from cache, update data in cache via api if need be
function getDataFromStorage() {
  if (localStorage.getItem(`${currencyElementOne.value}Data`) === null || localStorage.getItem(`${currencyElementOne.value}Timestamp`) < now) {
    console.log(`fetching ${currencyElementOne.value} number data from api.exchangeratesapi.io`);
    fetchData();
    } else {
      console.log(`fetching number data from local storage`)
    }
  return JSON.parse(localStorage.getItem(`${currencyElementOne.value}Data`)); 
  };

// Try to get CHART data from cache, update data in cache via api if need be
function getChartDataFromStorage() {
  if (localStorage.getItem(`${currencyElementOne.value}ChartData`) === null || localStorage.getItem(`${currencyElementOne.value}ChartTimestamp`) !== today) {
      fetchChartData();
    } else {
      console.log(`fetching chart data from local storage`)
    }
  return JSON.parse(localStorage.getItem(`${currencyElementOne.value}ChartData`)); 
  }

// Get exchange rate from storage and render currency values
function calculate() {
  console.log("entering calculate"); 
  let rate = JSON.parse(localStorage.getItem(`${currencyElementOne.value}Data`)).rates[currencyElementTwo.value];
  rateElement.innerText = `1 ${currencyElementOne.value} = ${rate.toFixed(4)} ${currencyElementTwo.value}`;
  amountElementTwo.value = (amountElementOne.value * rate).toFixed(2);
  let time = localStorage.getItem(`${currencyElementOne.value}Timestamp`) - delta;
  updated.innerText = `rates updated ${(now - time)/1000} seconds ago`;
  console.log("exiting calculate");
}

// Swap currency codes
function swap() {
  console.log("swapping")
  const temp = currencyElementOne.value;
  currencyElementOne.value = currencyElementTwo.value;
  currencyElementTwo.value = temp;
}

// Chart JS
function getKeys() {
  let s =  getChartDataFromStorage().rates;
  let keys = [];
  let months = [];
  for(var k in s) {
    if (k.slice(8,10) === '01' && !months.includes(k.slice(5,7))) {
      keys.push(k);
      months.push(k.slice(5,7));
    } else if (k.slice(8,10) === '03' && !months.includes(k.slice(5,7))) {
      keys.push(k);
      months.push(k.slice(5,7));
    }
  }
  return keys.sort()
}

function getValues() {
  let s = getChartDataFromStorage().rates;
  let keys = getKeys();
  let vals = [];
  for(var k in keys) {
    vals.push(s[keys[k]][currencyElementTwo.value])
  }
  return vals;
}

function addData(chart, data) {
  chart.data.datasets[0].data = data();
  chart.data.datasets[0].label = `${currencyElementOne.value}/${currencyElementTwo.value}`;
  chart.update();
}

function removeData(chart) {
  chart.data.datasets[0].data = [];
  chart.data.datasets[0].label = '';
  chart.update();
}

// Initialize
renderOptionsLists()
calculate();

var ctx = document.getElementById('myChart').getContext('2d');
var myChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: getKeys(),
      datasets: [{
          label: `${currencyElementOne.value}/${currencyElementTwo.value}`,
          data: [],
          backgroundColor: 'rgba(95,186,167,0)',
          borderWidth: 3,
          borderColor: 'rgba(95,186,167,.3)'
      }]
  },
  options: {
      layout: {
        padding: {
          right: 20,
          left: 5,
          top: 10,
          bottom: 10,
        }
      },
      scales: {
          yAxes: [{
              borderColor: 'Red',
              display: false,
              gridLines: {
                color: '',
                zeroLineColor: 'Red',
                drawTicks: false,
              },
              ticks: {
                  beginAtZero: false
              }
          }],
          xAxes: [{
              display: false,
              lineWidth: 0,
              drawTicks: true,
              gridLines: {
                color: '',
                zeroLineColor: '',
                drawBorder: false,
              },
              ticks: {
                fontColor: '#d3d3d3',
                minRotation: 90,
              }     
          }]
      },
    legend: {
      display: false
    }
  }
});

// Initialize chart
getChartDataFromStorage()
addData(myChart, getValues)

// Event listeners
currencyElementOne.addEventListener('change', () => {
  getDataFromStorage();
  calculate();
  getChartDataFromStorage();
  removeData(myChart);
  addData(myChart, getValues);
});
amountElementOne.addEventListener('input', () => {
  calculate();
});
currencyElementTwo.addEventListener('change', () => {
  getDataFromStorage();
  calculate();
  getChartDataFromStorage();
  removeData(myChart);
  addData(myChart, getValues);
});
amountElementTwo.addEventListener('input', calculate);
swapButton.addEventListener('click', () => {
  swap();
  getDataFromStorage()
  calculate();
  getChartDataFromStorage();
  removeData(myChart);
  addData(myChart, getValues);
});
