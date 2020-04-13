const currencyElementOne = document.getElementById('currency-one');
const amountElementOne = document.getElementById('amount-one');
const currencyElementTwo = document.getElementById('currency-two');
const amountElementTwo = document.getElementById('amount-two');
const rateElement = document.getElementById('rate');
const swapButton = document.getElementById('swap');
const updated = document.getElementById('updated');
const delta = 900000;


// Render options of select lists
async function renderOptionsLists() {
  let list = await getDataFromStorage();
  let sorted = Object.keys(list.rates).sort()
  let options1 = sorted.map(code => {
    if (code === "CAD") {
      return `<option value="${code}" selected>${code}</option>`;
    }
    return `<option value="${code}">${code}</option>`;
  })
  let options2 = sorted.map(code => {
    if (code === "USD") {
      return `<option value="${code}" selected>${code}</option>`;
    }
    return `<option value="${code}">${code}</option>`;
  })
  currencyElementOne.innerHTML = options1;
  currencyElementTwo.innerHTML = options2;
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
async function fetchChartData() {
  let today = new Date();
  console.log(`fetching ${currencyElementOne.value} chart data from api.exchangeratesapi.io`)
  const start = addMonths(today, -9);
  const end = addMonths(today, 0);
  await (fetch(`https://api.exchangeratesapi.io/history?start_at=${start}&end_at=${end}&base=${currencyElementOne.value}`)
    .then(res => res.json())
    .then(chartJson => {
      localStorage.setItem(`${currencyElementOne.value}ChartData`, JSON.stringify(chartJson));
      localStorage.setItem(`${currencyElementOne.value}ChartTimestamp`, today);
    })
    .then(console.log(`finished writing ${currencyElementOne.value} chart data to local`)))
}

// Fetch json data from api resource with base currency
async function fetchData() {
  now = new Date().getTime();
  await (fetch(`https://api.exchangeratesapi.io/latest?base=${currencyElementOne.value}`)
    .then(res => res.json())
    .then(myJson => {
      localStorage.setItem(`${currencyElementOne.value}Data`, JSON.stringify(myJson));
      localStorage.setItem(`${currencyElementOne.value}Timestamp`, now+delta);
    })
    .then(console.log(`finished writing ${currencyElementOne.value} number data to local`)))
  }

// Try to get data from cache, update data in cache via api if need be
async function getDataFromStorage() {
  now = new Date().getTime();
  if (localStorage.getItem(`${currencyElementOne.value}Data`) === null || localStorage.getItem(`${currencyElementOne.value}Timestamp`) < now) {
    console.log(`fetching ${currencyElementOne.value} number data from api.exchangeratesapi.io`);
    await fetchData();
    } else {
      console.log(`fetching number data from local storage`)
    }
  let numberData = await localStorage.getItem(`${currencyElementOne.value}Data`);
  return JSON.parse(numberData);
  };

// Try to get CHART data from cache, update data in cache via api if need be
async function getChartDataFromStorage() {
  let today = new Date();
  if (localStorage.getItem(`${currencyElementOne.value}ChartData`) === null || localStorage.getItem(`${currencyElementOne.value}ChartTimestamp`) < today) {
      await fetchChartData();
    } else {
      console.log(`fetching chart data from local storage`)
    }
  let chartData = await localStorage.getItem(`${currencyElementOne.value}ChartData`);
  let chartJson = await JSON.parse(chartData);
  return chartJson;
  } 

// Get exchange rate from storage and render currency values
async function calculate() {
  console.log("entering calculate");
  let now = new Date().getTime(); 
  let calcData = await getDataFromStorage();
  let rate = calcData.rates[currencyElementTwo.value];
  rateElement.innerText = `1 ${currencyElementOne.value} = ${rate.toFixed(4)} ${currencyElementTwo.value}`;
  amountElementTwo.value = (amountElementOne.value * rate).toFixed(2);
  let time = localStorage.getItem(`${currencyElementOne.value}Timestamp`) - delta;
  if (((now - time)/1000) < 60) {
    updated.innerText = `rates updated ${((now - time)/1000).toFixed(0)} seconds ago`
  } else if (((now - time)/1000) < 120) {
    updated.innerText = `rates updated 1 minute ago`
  } else {
    updated.innerText = `rates updated ${((now - time)/60000).toFixed(0)} minutes ago`
  }
};

// Swap currency codes
function swap() {
  console.log("swapping")
  const temp = currencyElementOne.value;
  currencyElementOne.value = currencyElementTwo.value;
  currencyElementTwo.value = temp;
}

// Initialize
renderOptionsLists();
calculate();

// Chart JS
async function getKeys() {
  let keysData = await getChartDataFromStorage();
  let s = keysData.rates;
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

async function getValues() {
  let valuesData = await getChartDataFromStorage();
  let s = valuesData.rates; 
  let keys = await getKeys();
  let vals = [];
  for(var k in keys) {
    vals.push(s[keys[k]][currencyElementTwo.value])
  }
  return vals;
}

async function addData(chart, data) {
  chart.data.datasets[0].data = await data();
  chart.data.datasets[0].label = `${currencyElementOne.value}/${currencyElementTwo.value}`;
  chart.data.labels = await getKeys();
  chart.update();
}

function removeData(chart) {
  chart.data.datasets[0].data = [];
  chart.data.datasets[0].label = '';
  chart.update();
}


var ctx = document.getElementById('myChart').getContext('2d');
var myChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
      datasets: [{
          label: `${currencyElementOne.value}/${currencyElementTwo.value}`,
          data: [],
          backgroundColor: 'rgba(95,186,167,0)',
          borderWidth: 3,
          borderColor: 'rgba(95,186,167,.5)'
      }]
  },
  options: {
      layout: {
        padding: {
          right: 25,
          left: 0,
          top: 0,
          bottom: 0,
        }
      },
      scales: {
          yAxes: [{
              borderColor: 'Red',
              display: true,
              gridLines: {
                color: '',
                zeroLineColor: 'Lightgray',
                drawTicks: true,
                drawBorder: false
              },
              ticks: {
                  beginAtZero: false,
                  fontSize: 10,
                  fontColor: 'Lightgray',
              },
          }],
          xAxes: [{
              display: true,
              lineWidth: 1,
              drawTicks: false,
              gridLines: {
                color: '',
                zeroLineColor: '',
                drawBorder: false,
                drawTicks: true
              },
              ticks: {
                fontColor: 'Lightgray',
                minRotation: 90,
                fontSize: 10,
                callback: function(value, index, values) {
                  let date = new Date(value);
                  let month = date.toLocaleString('default', {month: 'short'})
                  return month;
              }
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
addData(myChart, getValues, getKeys);

// Event listeners
currencyElementOne.addEventListener('change', () => {
  getDataFromStorage();
  calculate();
  removeData(myChart);
  addData(myChart, getValues, getKeys);
});
amountElementOne.addEventListener('input', () => {
  calculate();
});
currencyElementTwo.addEventListener('change', () => {
  getDataFromStorage();
  calculate();
  removeData(myChart);
  addData(myChart, getValues, getKeys);
});
amountElementTwo.addEventListener('input', calculate);
swapButton.addEventListener('click', () => {
  swap();
  calculate();
  removeData(myChart);
  addData(myChart, getValues, getKeys);
});
