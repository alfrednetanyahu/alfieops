// Global Chart Variables
let chart;
let buyHoldChart = null;
let pieChart = null;

// Tab Switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelector('.tab.active').classList.remove('active');
        this.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        document.getElementById(this.dataset.tab).classList.remove('hidden');
    });
});

// Show/Hide Custom Pie Section & Sign-Up Form
document.getElementById('investmentType').addEventListener('change', function () {
    const isCustom = this.value === 'custom';
    document.getElementById('customPieSection').style.display = isCustom ? 'block' : 'none';
    document.getElementById('signupSection').style.display = isCustom ? 'block' : 'none';
});

document.getElementById('investmentType').addEventListener('change', function () {
    const type = this.value;
    document.getElementById('indexSection').style.display = type === 'index' ? 'block' : 'none';
    document.getElementById('customPieSection').style.display = type === 'custom' ? 'block' : 'none';
});
// Add stock to pie dynamically
document.getElementById('addStockBtn').addEventListener('click', function () {
    const pieBuilder = document.getElementById('pieBuilder');
    const row = document.createElement('div');
    row.classList.add('pie-row');
    row.innerHTML = `
        <select class="stock-select">${getSp500Options()}</select>
        <input type="number" class="stock-weight" placeholder="% Weight" min="1" max="100" step="1" required>
        <button type="button" onclick="this.parentElement.remove()">Remove</button>
    `;
    pieBuilder.appendChild(row);
});

// Placeholder S&P 500 stocks
function getSp500Options() {
    const stocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'BRK.B', 'JPM', 'JNJ'];
    return stocks.map(stock => `<option value="${stock}">${stock}</option>`).join('');
}

// Main calculation handler
document.getElementById('investment-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const initialDeposit = parseFloat(document.getElementById('initial').value);
    const years = parseInt(document.getElementById('timeline').value);
    const amount = parseFloat(document.getElementById('amount').value);
    const frequency = document.getElementById('frequency').value;
    const contributionTiming = document.getElementById('contributionTiming').value;
    const investmentType = document.getElementById('investmentType').value;
    let annualReturnRate = 0.10;

    // Get return based on type
    if (investmentType === 'index') {
        const index = document.getElementById('index').value;
        if (index === 'sp500') annualReturnRate = 0.10;
        if (index === 'qqq') annualReturnRate = 0.12;
        if (index === 'magnificent7') annualReturnRate = 0.15;
    } else if (investmentType === 'custom') {
        annualReturnRate = 0.20;
        const weights = Array.from(document.querySelectorAll('.stock-weight')).map(input => parseFloat(input.value));
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        if (totalWeight !== 100) {
            alert('Total weights must sum up to 100%. Current sum: ' + totalWeight + '%');
            return;
        }
    }

    const periods = frequency === 'monthly' ? years * 12 : years;
    const effectiveRate = frequency === 'monthly' ? Math.pow(1 + annualReturnRate, 1 / 12) - 1 : annualReturnRate;

    const initialData = [];
    const investedData = [];
    const growthData = [];
    const labels = [];
    let totalValue = initialDeposit;
    let totalInvested = initialDeposit;

    // Example loop
    for (let i = 1; i <= periods; i++) {
        if (contributionTiming === 'beginning') totalValue += amount;
        totalValue *= (1 + effectiveRate);
        if (contributionTiming === 'end') totalValue += amount;
        totalInvested += amount;

        let totalInitial = initialDeposit; // Fixed over time
        let totalContributions = totalInvested - initialDeposit;
        let growth = totalValue - totalInvested;

        // Push annual snapshots
        if (frequency === 'monthly' && i % 12 === 0) {
            labels.push(`Year ${i / 12}`);
            initialData.push(totalInitial.toFixed(2));
            investedData.push(totalContributions.toFixed(2));
            growthData.push(growth.toFixed(2));
        } else if (frequency === 'yearly') {
            labels.push(`Year ${i}`);
            initialData.push(totalInitial.toFixed(2));
            investedData.push(totalContributions.toFixed(2));
            growthData.push(growth.toFixed(2));
        }
    }

    // Display result
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<h3>Estimated Value: $${totalValue.toFixed(2)}</h3><p>Total Invested: $${totalInvested.toFixed(2)}</p>`;
    
    // Render Chart (as BAR)
    if (chart) chart.destroy();
    const ctx = document.getElementById('investmentChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Initial Deposit',
                    data: initialData, // Array of initial deposits (can be fixed per year)
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'blue',
                    borderWidth: 1
                },
                {
                    label: 'Invested Amount (Contributions)',
                    data: investedData, // Contributions accumulated over time (excluding initial)
                    backgroundColor: 'rgba(255, 206, 86, 0.7)',
                    borderColor: 'orange',
                    borderWidth: 1
                },
                {
                    label: 'Growth (Interest)',
                    data: growthData, // Pure growth amount
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'green',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                x: { stacked: true },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });

    const pieCtx = document.getElementById('pieChart').getContext('2d');

    // ✅ Ensure container is visible
    document.getElementById('pieChart').parentElement.style.display = 'block';

    // ✅ Fix: Destroy the existing pie chart if it exists
    if (pieChart) {pieChart.destroy();}

    let pieLabels = [];
    let pieData = [];
    let pieColors = [];

    if (investmentType === 'index') {
        pieLabels = [document.getElementById('index').value.toUpperCase()];
        pieData = [100];
        pieColors = ['#007BFF'];
    } else if (investmentType === 'custom') {
        pieLabels = Array.from(document.querySelectorAll('.pie-row select')).map(sel => sel.value);
        pieData = Array.from(document.querySelectorAll('.pie-row input')).map(input => parseFloat(input.value));
        pieColors = pieLabels.map(() => getRandomColor());
    }

    // ✅ Fix: Create a new pie chart after destroying the old one
    pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: pieLabels,
            datasets: [{
                data: pieData,
                backgroundColor: pieColors
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });


    // Random color generator for pie segments
    function getRandomColor() {
        return `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
    }

    // ✅ Update Buy & Hold chart
    const buyHoldCtx = document.getElementById('buyHoldChart').getContext('2d');

    // ✅ Ensure container is visible
    document.getElementById('buyHoldChart').parentElement.style.display = 'block';

    // ✅ Destroy existing chart before creating a new one
    if (buyHoldChart) {buyHoldChart.destroy();}

    let buyHoldChartlabels = [];
    let buyHoldData = [];
    let buyHoldtotalValue = initialDeposit;
    let buyHoldtotalInvested = initialDeposit;

    const buyHoldperiods = frequency === 'monthly' ? years * 12 : years;
    const buyHoldeffectiveRate = frequency === 'monthly' ? Math.pow(1 + annualReturnRate, 1 / 12) - 1 : annualReturnRate;


    // Example loop
    for (let i = 1; i <= buyHoldperiods; i++) {
        if (contributionTiming === 'beginning') buyHoldtotalValue += amount;
        buyHoldtotalValue *= (1 + buyHoldeffectiveRate);
        if (contributionTiming === 'end') buyHoldtotalValue += amount;
        buyHoldtotalInvested += amount;

        let buyHoldInitial = initialDeposit; // Fixed over time
        let totalContributions = buyHoldtotalInvested - initialDeposit;
        let growth = buyHoldtotalValue - buyHoldtotalInvested;
        
        if (frequency === 'monthly' && i % 12 === 0) {
            buyHoldChartlabels.push(`Year ${i / 12}`);
            buyHoldData.push(buyHoldtotalValue.toFixed(2));
            
        } else if (frequency === 'yearly') {
            buyHoldChartlabels.push(`Year ${i}`);
            buyHoldData.push(buyHoldtotalValue.toFixed(2));
        }
    }


    // ✅ Ensure chart only renders if data exists
    if (buyHoldData.length === 0) {
        console.error("Buy & Hold data is empty!");
        return;
    }

    // ✅ Create the Buy & Hold Line Chart
    buyHoldChart = new Chart(buyHoldCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Buy & Hold Growth',
                data: buyHoldData,
                borderColor: 'purple',
                backgroundColor: 'rgba(128, 0, 128, 0.2)',
                fill: true,
                tension: 0.1,
                borderWidth: 2,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function (value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });

});