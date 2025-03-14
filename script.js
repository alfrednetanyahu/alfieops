let chart; // Global chart instance

document.getElementById('investment-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const initialDeposit = parseFloat(document.getElementById('initial').value);
    const years = parseInt(document.getElementById('timeline').value);
    const amount = parseFloat(document.getElementById('amount').value);
    const frequency = document.getElementById('frequency').value;
    const index = document.getElementById('index').value;
    const contributionTiming = document.getElementById('contributionTiming').value;

    let annualReturnRate = 0.10;
    if (index === 'qqq') annualReturnRate = 0.12;
    if (index === 'magnificent7') annualReturnRate = 0.15;

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

    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<h3>Estimated Value: $${totalValue.toFixed(2)}</h3><p>Total Invested: $${totalInvested.toFixed(2)}</p>`;

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
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    labels: { font: { size: 14 } }
                }
            },
            scales: {
                y: {
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
});
