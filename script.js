let chart;

// Handle investment type switching
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
        <input type="number" class="stock-weight" placeholder="% Weight" min="1" max="100" required>
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

    let totalValue = initialDeposit;
    let totalInvested = initialDeposit;
    const growthData = [];
    const investedData = [];
    const labels = [];

    for (let i = 1; i <= periods; i++) {
        if (contributionTiming === 'beginning') totalValue += amount;
        totalValue *= (1 + effectiveRate);
        if (contributionTiming === 'end') totalValue += amount;
        totalInvested += amount;

        if (frequency === 'monthly' && i % 12 === 0) {
            labels.push(`Year ${i / 12}`);
            growthData.push((totalValue - totalInvested).toFixed(2));
            investedData.push(totalInvested.toFixed(2));
        } else if (frequency === 'yearly') {
            labels.push(`Year ${i}`);
            growthData.push((totalValue - totalInvested).toFixed(2));
            investedData.push(totalInvested.toFixed(2));
        }
    }

    // Display result
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<h3>Estimated Value: $${totalValue.toFixed(2)}</h3><p>Total Invested: $${totalInvested.toFixed(2)}</p>`;

    // Render Chart
    if (chart) chart.destroy();
    const ctx = document.getElementById('investmentChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Invested Amount',
                    data: investedData,
                    borderColor: 'blue',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    fill: true,
                    tension: 0.1,
                    borderWidth: 3,
                    pointRadius: 0,
                    borderDash: [10, 5]
                },
                {
                    label: 'Growth (Interest)',
                    data: growthData,
                    borderColor: 'green',
                    backgroundColor: 'rgba(75, 192, 192, 0.3)',
                    fill: true,
                    tension: 0.1,
                    borderWidth: 3,
                    pointRadius: 0
                }
            ]
        }
    });
});
