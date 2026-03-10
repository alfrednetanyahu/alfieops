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
            content.classList.remove('active');
        });

        const target = document.getElementById(this.dataset.tab);
        target.classList.remove('hidden');
        target.classList.add('active');
    });
});

// Show/Hide Custom Pie Section & Sign-Up Form
document.getElementById('investmentType').addEventListener('change', function () {
    const isCustom = this.value === 'custom';
    document.getElementById('customPieSection').style.display = isCustom ? 'block' : 'none';

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

// =============================================
// CHART PANEL SWITCHER (show correct charts per tab)
// =============================================
function switchChartPanel(tabName) {
    const panels = ['investmentCharts', 'loanCharts', 'mortgageCharts', 'taxCharts'];
    panels.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    const map = {
        investment: 'investmentCharts',
        loan: 'loanCharts',
        mortgage: 'mortgageCharts',
        tax: 'taxCharts'
    };
    const target = document.getElementById(map[tabName]);
    if (target) target.classList.remove('hidden');
}

// Patch tab switching to also switch chart panels
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function () {
        switchChartPanel(this.dataset.tab);
    });
});

// =============================================
// LOAN CALCULATOR
// =============================================
let loanAmortChartInstance = null;
let loanBreakdownChartInstance = null;

document.getElementById('loan-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const principal = parseFloat(document.getElementById('loanAmount').value);
    const annualRate = parseFloat(document.getElementById('loanRate').value) / 100;
    const years = parseInt(document.getElementById('loanTerm').value);
    const loanType = document.getElementById('loanType').value;
    const monthlyRate = annualRate / 12;
    const n = years * 12;

    let monthlyPayment = 0;
    let totalInterest = 0;
    let totalPaid = 0;
    let schedule = [];

    if (loanType === 'amortizing') {
        monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
        let balance = principal;
        for (let i = 1; i <= n; i++) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            balance -= principalPayment;
            totalInterest += interestPayment;
            if (i % 12 === 0) {
                schedule.push({ year: i / 12, balance: Math.max(balance, 0).toFixed(2), interest: totalInterest.toFixed(2) });
            }
        }
        totalPaid = monthlyPayment * n;

    } else if (loanType === 'interestOnly') {
        monthlyPayment = principal * monthlyRate;
        totalInterest = monthlyPayment * n;
        totalPaid = totalInterest + principal;
        let cumInterest = 0;
        for (let i = 1; i <= years; i++) {
            cumInterest += monthlyPayment * 12;
            schedule.push({ year: i, balance: principal.toFixed(2), interest: cumInterest.toFixed(2) });
        }

    } else if (loanType === 'bulletLoan') {
        // No periodic principal; interest accrues, lump sum at end
        monthlyPayment = principal * monthlyRate;
        totalInterest = monthlyPayment * n;
        totalPaid = principal + totalInterest;
        let cumInterest = 0;
        for (let i = 1; i <= years; i++) {
            cumInterest += monthlyPayment * 12;
            schedule.push({ year: i, balance: principal.toFixed(2), interest: cumInterest.toFixed(2) });
        }
    }

    const resultDiv = document.getElementById('loanResult');
    resultDiv.innerHTML = `
        <h3>Monthly Payment: $${monthlyPayment.toFixed(2)}</h3>
        <p>Total Paid: $${totalPaid.toFixed(2)}</p>
        <p>Total Interest: $${totalInterest.toFixed(2)}</p>
        <p>Principal: $${principal.toFixed(2)}</p>
    `;

    // Amortization line chart
    if (loanAmortChartInstance) loanAmortChartInstance.destroy();
    const loanAmortCtx = document.getElementById('loanAmortChart').getContext('2d');
    loanAmortChartInstance = new Chart(loanAmortCtx, {
        type: 'line',
        data: {
            labels: schedule.map(s => `Year ${s.year}`),
            datasets: [
                {
                    label: 'Remaining Balance',
                    data: schedule.map(s => s.balance),
                    borderColor: '#007BFF',
                    backgroundColor: 'rgba(0, 123, 255, 0.15)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 3
                },
                {
                    label: 'Cumulative Interest Paid',
                    data: schedule.map(s => s.interest),
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true }, title: { display: true, text: 'Loan Balance & Interest Over Time' } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => '$' + Number(v).toLocaleString() }
                }
            }
        }
    });

    // Breakdown doughnut
    if (loanBreakdownChartInstance) loanBreakdownChartInstance.destroy();
    const loanBreakCtx = document.getElementById('loanBreakdownChart').getContext('2d');
    loanBreakdownChartInstance = new Chart(loanBreakCtx, {
        type: 'doughnut',
        data: {
            labels: ['Principal', 'Total Interest'],
            datasets: [{
                data: [principal.toFixed(2), totalInterest.toFixed(2)],
                backgroundColor: ['rgba(0,123,255,0.8)', 'rgba(220,53,69,0.8)'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Principal vs Total Interest' }
            }
        }
    });
});


// =============================================
// MORTGAGE CALCULATOR
// =============================================
let mortgageAmortChartInstance = null;
let mortgageBreakdownChartInstance = null;

document.getElementById('mortgage-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const homePrice = parseFloat(document.getElementById('homePrice').value);
    const downPayment = parseFloat(document.getElementById('downPayment').value);
    const annualRate = parseFloat(document.getElementById('mortgageRate').value) / 100;
    const years = parseInt(document.getElementById('mortgageTerm').value);
    const propertyTax = parseFloat(document.getElementById('propertyTax').value) || 0;
    const homeInsurance = parseFloat(document.getElementById('homeInsurance').value) || 0;

    const principal = homePrice - downPayment;
    const monthlyRate = annualRate / 12;
    const n = years * 12;

    const monthlyPI = principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    const monthlyTax = propertyTax / 12;
    const monthlyInsurance = homeInsurance / 12;
    const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance;

    let totalInterest = 0;
    let balance = principal;
    let schedule = [];

    for (let i = 1; i <= n; i++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPI - interestPayment;
        balance -= principalPayment;
        totalInterest += interestPayment;
        if (i % 12 === 0) {
            schedule.push({
                year: i / 12,
                balance: Math.max(balance, 0).toFixed(2),
                equity: (homePrice - Math.max(balance, 0)).toFixed(2)
            });
        }
    }

    const totalCost = monthlyPI * n + propertyTax * years + homeInsurance * years;
    const downPct = ((downPayment / homePrice) * 100).toFixed(1);
    const pmi = downPayment / homePrice < 0.20 ? (principal * 0.005 / 12).toFixed(2) : '0.00';

    const resultDiv = document.getElementById('mortgageResult');
    resultDiv.innerHTML = `
        <h3>Monthly Payment: $${totalMonthly.toFixed(2)}</h3>
        <p>Principal & Interest: $${monthlyPI.toFixed(2)}/mo</p>
        <p>Property Tax: $${monthlyTax.toFixed(2)}/mo</p>
        <p>Insurance: $${monthlyInsurance.toFixed(2)}/mo</p>
        ${parseFloat(pmi) > 0 ? `<p>Est. PMI (< 20% down): $${pmi}/mo</p>` : ''}
        <p>Down Payment: ${downPct}% ($${downPayment.toLocaleString()})</p>
        <p>Total Interest Paid: $${totalInterest.toFixed(2)}</p>
        <p>Total Cost of Home: $${totalCost.toFixed(2)}</p>
    `;

    // Amortization: balance vs equity
    if (mortgageAmortChartInstance) mortgageAmortChartInstance.destroy();
    const mortAmortCtx = document.getElementById('mortgageAmortChart').getContext('2d');
    mortgageAmortChartInstance = new Chart(mortAmortCtx, {
        type: 'bar',
        data: {
            labels: schedule.map(s => `Yr ${s.year}`),
            datasets: [
                {
                    label: 'Remaining Balance',
                    data: schedule.map(s => s.balance),
                    backgroundColor: 'rgba(220,53,69,0.7)',
                    borderColor: '#dc3545',
                    borderWidth: 1
                },
                {
                    label: 'Home Equity',
                    data: schedule.map(s => s.equity),
                    backgroundColor: 'rgba(40,167,69,0.7)',
                    borderColor: '#28a745',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                title: { display: true, text: 'Equity vs Remaining Balance' }
            },
            scales: {
                x: { stacked: true },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: { callback: v => '$' + Number(v).toLocaleString() }
                }
            }
        }
    });

    // Cost breakdown doughnut
    if (mortgageBreakdownChartInstance) mortgageBreakdownChartInstance.destroy();
    const mortBreakCtx = document.getElementById('mortgageBreakdownChart').getContext('2d');
    mortgageBreakdownChartInstance = new Chart(mortBreakCtx, {
        type: 'doughnut',
        data: {
            labels: ['Principal', 'Total Interest', 'Property Tax', 'Insurance'],
            datasets: [{
                data: [
                    principal.toFixed(2),
                    totalInterest.toFixed(2),
                    (propertyTax * years).toFixed(2),
                    (homeInsurance * years).toFixed(2)
                ],
                backgroundColor: ['rgba(0,123,255,0.8)', 'rgba(220,53,69,0.8)', 'rgba(255,193,7,0.8)', 'rgba(40,167,69,0.8)'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Total Cost Breakdown' }
            }
        }
    });
});


// =============================================
// INCOME TAX CALCULATOR (2024 US Federal)
// =============================================
let taxBracketChartInstance = null;
let taxBreakdownChartInstance = null;

document.getElementById('deductionType').addEventListener('change', function () {
    document.getElementById('itemizedGroup').style.display = this.value === 'itemized' ? 'block' : 'none';
});

document.getElementById('tax-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const grossIncome = parseFloat(document.getElementById('grossIncome').value);
    const filingStatus = document.getElementById('filingStatus').value;
    const deductionType = document.getElementById('deductionType').value;
    const itemizedAmount = parseFloat(document.getElementById('itemizedAmount').value) || 0;
    const state = document.getElementById('taxState').value;

    // 2024 Standard deductions
    const standardDeductions = {
        single: 14600,
        married: 29200,
        marriedSeparate: 14600,
        headOfHousehold: 21900
    };

    // 2024 Federal brackets
    const brackets = {
        single: [
            { rate: 0.10, min: 0, max: 11600 },
            { rate: 0.12, min: 11600, max: 47150 },
            { rate: 0.22, min: 47150, max: 100525 },
            { rate: 0.24, min: 100525, max: 191950 },
            { rate: 0.32, min: 191950, max: 243725 },
            { rate: 0.35, min: 243725, max: 609350 },
            { rate: 0.37, min: 609350, max: Infinity }
        ],
        married: [
            { rate: 0.10, min: 0, max: 23200 },
            { rate: 0.12, min: 23200, max: 94300 },
            { rate: 0.22, min: 94300, max: 201050 },
            { rate: 0.24, min: 201050, max: 383900 },
            { rate: 0.32, min: 383900, max: 487450 },
            { rate: 0.35, min: 487450, max: 731200 },
            { rate: 0.37, min: 731200, max: Infinity }
        ],
        marriedSeparate: [
            { rate: 0.10, min: 0, max: 11600 },
            { rate: 0.12, min: 11600, max: 47150 },
            { rate: 0.22, min: 47150, max: 100525 },
            { rate: 0.24, min: 100525, max: 191950 },
            { rate: 0.32, min: 191950, max: 243725 },
            { rate: 0.35, min: 243725, max: 365600 },
            { rate: 0.37, min: 365600, max: Infinity }
        ],
        headOfHousehold: [
            { rate: 0.10, min: 0, max: 16550 },
            { rate: 0.12, min: 16550, max: 63100 },
            { rate: 0.22, min: 63100, max: 100500 },
            { rate: 0.24, min: 100500, max: 191950 },
            { rate: 0.32, min: 191950, max: 243700 },
            { rate: 0.35, min: 243700, max: 609350 },
            { rate: 0.37, min: 609350, max: Infinity }
        ]
    };

    const stateTaxRates = {
        CA: 0.133, NY: 0.109, TX: 0, FL: 0, WA: 0,
        IL: 0.0495, PA: 0.0307, OH: 0.0399, GA: 0.0549, NC: 0.045, Other: 0.05
    };

    const standardDed = standardDeductions[filingStatus];
    const deduction = deductionType === 'itemized' ? Math.max(itemizedAmount, standardDed) : standardDed;
    const taxableIncome = Math.max(grossIncome - deduction, 0);

    // Federal tax
    let federalTax = 0;
    let bracketBreakdown = [];
    const selectedBrackets = brackets[filingStatus];

    for (const bracket of selectedBrackets) {
        if (taxableIncome <= bracket.min) break;
        const taxable = Math.min(taxableIncome, bracket.max) - bracket.min;
        const tax = taxable * bracket.rate;
        federalTax += tax;
        if (tax > 0) bracketBreakdown.push({ label: `${(bracket.rate * 100).toFixed(0)}%`, tax: tax.toFixed(2), income: taxable.toFixed(2) });
    }

    // FICA
    const socialSecurity = Math.min(grossIncome, 168600) * 0.062;
    const medicare = grossIncome * 0.0145;
    const additionalMedicare = grossIncome > 200000 ? (grossIncome - 200000) * 0.009 : 0;
    const ficaTax = socialSecurity + medicare + additionalMedicare;

    // State tax
    const stateRate = stateTaxRates[state];
    const stateTax = taxableIncome * stateRate;

    const totalTax = federalTax + ficaTax + stateTax;
    const effectiveRate = ((totalTax / grossIncome) * 100).toFixed(2);
    const marginalRate = selectedBrackets.find(b => taxableIncome <= b.max)?.rate * 100 || 37;
    const takeHome = grossIncome - totalTax;

    const resultDiv = document.getElementById('taxResult');
    resultDiv.innerHTML = `
        <h3>Estimated Total Tax: $${totalTax.toFixed(2)}</h3>
        <p>Federal Income Tax: $${federalTax.toFixed(2)}</p>
        <p>FICA (SS + Medicare): $${ficaTax.toFixed(2)}</p>
        <p>State Tax (${state}): $${stateTax.toFixed(2)}</p>
        <p>Taxable Income: $${taxableIncome.toLocaleString()}</p>
        <p>Effective Rate: ${effectiveRate}% | Marginal Rate: ${marginalRate}%</p>
        <p><strong>Take-Home Pay: $${takeHome.toFixed(2)}/yr ($${(takeHome / 12).toFixed(2)}/mo)</strong></p>
    `;

    // Bracket bar chart
    if (taxBracketChartInstance) taxBracketChartInstance.destroy();
    const taxBracketCtx = document.getElementById('taxBracketChart').getContext('2d');
    taxBracketChartInstance = new Chart(taxBracketCtx, {
        type: 'bar',
        data: {
            labels: bracketBreakdown.map(b => `${b.label} Bracket`),
            datasets: [{
                label: 'Tax Owed Per Bracket',
                data: bracketBreakdown.map(b => b.tax),
                backgroundColor: [
                    'rgba(0,123,255,0.7)', 'rgba(40,167,69,0.7)', 'rgba(255,193,7,0.7)',
                    'rgba(220,53,69,0.7)', 'rgba(111,66,193,0.7)', 'rgba(23,162,184,0.7)', 'rgba(255,99,71,0.7)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Federal Tax by Bracket' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => '$' + Number(v).toLocaleString() }
                }
            }
        }
    });

    // Tax vs take-home doughnut
    if (taxBreakdownChartInstance) taxBreakdownChartInstance.destroy();
    const taxBreakCtx = document.getElementById('taxBreakdownChart').getContext('2d');
    taxBreakdownChartInstance = new Chart(taxBreakCtx, {
        type: 'doughnut',
        data: {
            labels: ['Take-Home', 'Federal Tax', 'FICA', `State Tax (${state})`],
            datasets: [{
                data: [takeHome.toFixed(2), federalTax.toFixed(2), ficaTax.toFixed(2), stateTax.toFixed(2)],
                backgroundColor: [
                    'rgba(40,167,69,0.85)',
                    'rgba(220,53,69,0.85)',
                    'rgba(255,193,7,0.85)',
                    'rgba(0,123,255,0.85)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Income Breakdown' }
            }
        }
    });
});

// ============================================================
// LOAN CALCULATOR
// ============================================================

let loanAmortChart = null;
let loanBreakdownChart = null;

document.getElementById('loan-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const principal = parseFloat(document.getElementById('loanAmount').value);
    const annualRate = parseFloat(document.getElementById('loanRate').value) / 100;
    const years = parseInt(document.getElementById('loanTerm').value);
    const loanType = document.getElementById('loanType').value;

    const monthlyRate = annualRate / 12;
    const numPayments = years * 12;

    let monthlyPayment = 0;
    let totalInterest = 0;
    let totalPaid = 0;
    let schedule = [];

    if (loanType === 'amortized') {
        if (monthlyRate === 0) {
            monthlyPayment = principal / numPayments;
        } else {
            monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))
                / (Math.pow(1 + monthlyRate, numPayments) - 1);
        }
        let balance = principal;
        for (let i = 1; i <= numPayments; i++) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = monthlyPayment - interestPayment;
            balance -= principalPayment;
            totalInterest += interestPayment;
            if (i % 12 === 0) {
                schedule.push({ year: i / 12, balance: Math.max(balance, 0).toFixed(2), interest: totalInterest.toFixed(2) });
            }
        }
        totalPaid = monthlyPayment * numPayments;

    } else if (loanType === 'interestOnly') {
        monthlyPayment = principal * monthlyRate;
        totalInterest = monthlyPayment * numPayments;
        totalPaid = totalInterest + principal;
        for (let y = 1; y <= years; y++) {
            schedule.push({ year: y, balance: principal.toFixed(2), interest: (monthlyPayment * 12 * y).toFixed(2) });
        }

    } else if (loanType === 'bulletLoan') {
        monthlyPayment = principal * monthlyRate;
        totalInterest = monthlyPayment * numPayments;
        totalPaid = totalInterest + principal;
        for (let y = 1; y <= years; y++) {
            schedule.push({ year: y, balance: principal.toFixed(2), interest: (monthlyPayment * 12 * y).toFixed(2) });
        }
    }

    const resultDiv = document.getElementById('loanResult');
    if (loanType === 'bulletLoan') {
        resultDiv.innerHTML = `
            <h3>Monthly Interest Payment: $${monthlyPayment.toFixed(2)}</h3>
            <p>Lump Sum Due at End: $${principal.toLocaleString()}</p>
            <p>Total Interest Paid: $${totalInterest.toFixed(2)}</p>
            <p>Total Cost of Loan: $${totalPaid.toFixed(2)}</p>`;
    } else {
        resultDiv.innerHTML = `
            <h3>Monthly Payment: $${monthlyPayment.toFixed(2)}</h3>
            <p>Total Interest Paid: $${totalInterest.toFixed(2)}</p>
            <p>Total Cost of Loan: $${totalPaid.toFixed(2)}</p>`;
    }

    // Amortization / Balance over time chart
    if (loanAmortChart) loanAmortChart.destroy();
    const loanAmortCtx = document.getElementById('loanAmortChart').getContext('2d');
    loanAmortChart = new Chart(loanAmortCtx, {
        type: 'line',
        data: {
            labels: schedule.map(s => `Year ${s.year}`),
            datasets: [
                {
                    label: 'Remaining Balance',
                    data: schedule.map(s => s.balance),
                    borderColor: '#007BFF',
                    backgroundColor: 'rgba(0,123,255,0.15)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 3
                },
                {
                    label: 'Cumulative Interest Paid',
                    data: schedule.map(s => s.interest),
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220,53,69,0.1)',
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true }, title: { display: true, text: 'Loan Balance & Cumulative Interest Over Time' } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => '$' + parseFloat(v).toLocaleString() }
                }
            }
        }
    });

    // Breakdown pie
    if (loanBreakdownChart) loanBreakdownChart.destroy();
    const loanBreakCtx = document.getElementById('loanBreakdownChart').getContext('2d');
    loanBreakdownChart = new Chart(loanBreakCtx, {
        type: 'doughnut',
        data: {
            labels: ['Principal', 'Total Interest'],
            datasets: [{
                data: [principal.toFixed(2), totalInterest.toFixed(2)],
                backgroundColor: ['rgba(0,123,255,0.8)', 'rgba(220,53,69,0.8)'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Principal vs. Total Interest' }
            }
        }
    });
});


// ============================================================
// MORTGAGE CALCULATOR
// ============================================================

let mortgageAmortChart = null;
let mortgageBreakdownChart = null;

document.getElementById('mortgage-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const homePrice = parseFloat(document.getElementById('homePrice').value);
    const downPayment = parseFloat(document.getElementById('downPayment').value);
    const annualRate = parseFloat(document.getElementById('mortgageRate').value) / 100;
    const years = parseInt(document.getElementById('mortgageTerm').value);
    const annualPropertyTax = parseFloat(document.getElementById('propertyTax').value) || 0;
    const annualInsurance = parseFloat(document.getElementById('homeInsurance').value) || 0;
    const monthlyPMI = parseFloat(document.getElementById('pmi').value) || 0;

    const loanAmount = homePrice - downPayment;
    const monthlyRate = annualRate / 12;
    const numPayments = years * 12;

    let monthlyPrincipalInterest = 0;
    if (monthlyRate === 0) {
        monthlyPrincipalInterest = loanAmount / numPayments;
    } else {
        monthlyPrincipalInterest = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))
            / (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    const monthlyTax = annualPropertyTax / 12;
    const monthlyInsurance = annualInsurance / 12;
    const totalMonthlyPayment = monthlyPrincipalInterest + monthlyTax + monthlyInsurance + monthlyPMI;

    let balance = loanAmount;
    let totalInterest = 0;
    let schedule = [];

    for (let i = 1; i <= numPayments; i++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPrincipalInterest - interestPayment;
        balance -= principalPayment;
        totalInterest += interestPayment;
        if (i % 12 === 0) {
            schedule.push({ year: i / 12, balance: Math.max(balance, 0).toFixed(2), equity: (homePrice - Math.max(balance, 0)).toFixed(2) });
        }
    }

    const totalCost = monthlyPrincipalInterest * numPayments;
    const downPct = ((downPayment / homePrice) * 100).toFixed(1);

    document.getElementById('mortgageResult').innerHTML = `
        <h3>Monthly Payment: $${totalMonthlyPayment.toFixed(2)}</h3>
        <p><strong>Principal & Interest:</strong> $${monthlyPrincipalInterest.toFixed(2)}</p>
        <p><strong>Property Tax:</strong> $${monthlyTax.toFixed(2)}</p>
        <p><strong>Insurance:</strong> $${monthlyInsurance.toFixed(2)}</p>
        ${monthlyPMI > 0 ? `<p><strong>PMI:</strong> $${monthlyPMI.toFixed(2)}</p>` : ''}
        <p><strong>Down Payment:</strong> $${downPayment.toLocaleString()} (${downPct}%)</p>
        <p><strong>Loan Amount:</strong> $${loanAmount.toLocaleString()}</p>
        <p><strong>Total Interest:</strong> $${totalInterest.toFixed(2)}</p>
        <p><strong>Total Cost (P+I):</strong> $${totalCost.toFixed(2)}</p>`;

    // Equity vs Balance over time
    if (mortgageAmortChart) mortgageAmortChart.destroy();
    const mortgageAmortCtx = document.getElementById('mortgageAmortChart').getContext('2d');
    mortgageAmortChart = new Chart(mortgageAmortCtx, {
        type: 'bar',
        data: {
            labels: schedule.map(s => `Yr ${s.year}`),
            datasets: [
                {
                    label: 'Remaining Balance',
                    data: schedule.map(s => s.balance),
                    backgroundColor: 'rgba(220,53,69,0.7)',
                    borderColor: '#dc3545',
                    borderWidth: 1
                },
                {
                    label: 'Equity Built',
                    data: schedule.map(s => s.equity),
                    backgroundColor: 'rgba(40,167,69,0.7)',
                    borderColor: '#28a745',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true }, title: { display: true, text: 'Equity vs. Remaining Balance Over Time' } },
            scales: {
                x: { stacked: true },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: { callback: v => '$' + parseFloat(v).toLocaleString() }
                }
            }
        }
    });

    // Monthly payment breakdown donut
    if (mortgageBreakdownChart) mortgageBreakdownChart.destroy();
    const mortBreakCtx = document.getElementById('mortgageBreakdownChart').getContext('2d');
    const breakdownLabels = ['Principal & Interest', 'Property Tax', 'Insurance'];
    const breakdownData = [monthlyPrincipalInterest, monthlyTax, monthlyInsurance];
    const breakdownColors = ['rgba(0,123,255,0.8)', 'rgba(255,193,7,0.8)', 'rgba(23,162,184,0.8)'];
    if (monthlyPMI > 0) {
        breakdownLabels.push('PMI');
        breakdownData.push(monthlyPMI);
        breakdownColors.push('rgba(108,117,125,0.8)');
    }
    mortgageBreakdownChart = new Chart(mortBreakCtx, {
        type: 'doughnut',
        data: {
            labels: breakdownLabels,
            datasets: [{ data: breakdownData.map(d => d.toFixed(2)), backgroundColor: breakdownColors, borderWidth: 2 }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Monthly Payment Breakdown' }
            }
        }
    });
});


// ============================================================
// INCOME TAX CALCULATOR (US Federal — 2023 & 2024)
// ============================================================

let taxBreakdownChart = null;
let taxBracketsChart = null;

// Toggle itemized section
document.getElementById('deductionType').addEventListener('change', function () {
    const isItemized = this.value === 'itemized';
    document.getElementById('itemizedSection').style.display = isItemized ? 'block' : 'none';
});

// 2024 & 2023 US Federal Tax Brackets
const TAX_BRACKETS = {
    2024: {
        single:          [10502, 47150, 100525, 191950, 243725, 609350],
        marriedJoint:    [23200, 94300, 201050, 383900, 487450, 731200],
        marriedSeparate: [11600, 47150, 100525, 191950, 243725, 365600],
        headOfHousehold: [16550, 63100, 100500, 191950, 243700, 609350],
        rates: [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37],
        standardDeduction: { single: 14600, marriedJoint: 29200, marriedSeparate: 14600, headOfHousehold: 21900 }
    },
    2023: {
        single:          [11000, 44725, 95375, 182396, 231250, 578125],
        marriedJoint:    [22000, 89450, 190750, 364200, 462500, 693750],
        marriedSeparate: [11000, 44725, 95375, 182050, 231250, 346875],
        headOfHousehold: [15700, 59850, 95350, 182150, 231250, 578100],
        rates: [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37],
        standardDeduction: { single: 13850, marriedJoint: 27700, marriedSeparate: 13850, headOfHousehold: 20800 }
    }
};

function calcFederalTax(taxableIncome, brackets, rates) {
    let tax = 0;
    let prev = 0;
    const bracketTaxes = [];
    for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        const rate = rates[i];
        if (taxableIncome <= prev) { bracketTaxes.push(0); continue; }
        const taxable = Math.min(taxableIncome, bracket) - prev;
        const t = taxable * rate;
        tax += t;
        bracketTaxes.push(t);
        prev = bracket;
    }
    // top bracket
    if (taxableIncome > prev) {
        const t = (taxableIncome - prev) * rates[rates.length - 1];
        tax += t;
        bracketTaxes.push(t);
    } else {
        bracketTaxes.push(0);
    }
    return { tax, bracketTaxes };
}

document.getElementById('tax-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const grossIncome = parseFloat(document.getElementById('grossIncome').value) || 0;
    const otherIncome = parseFloat(document.getElementById('otherIncome').value) || 0;
    const preTaxDed = parseFloat(document.getElementById('preTaxDeductions').value) || 0;
    const filingStatus = document.getElementById('filingStatus').value;
    const deductionType = document.getElementById('deductionType').value;
    const taxYear = parseInt(document.getElementById('taxYear').value);

    const brackets = TAX_BRACKETS[taxYear];
    const standardDeduction = brackets.standardDeduction[filingStatus];
    const itemizedAmount = parseFloat(document.getElementById('itemizedAmount').value) || 0;
    const deduction = deductionType === 'standard' ? standardDeduction : Math.max(itemizedAmount, standardDeduction);

    const totalIncome = grossIncome + otherIncome;
    const agi = totalIncome - preTaxDed;
    const taxableIncome = Math.max(0, agi - deduction);

    const { tax: federalTax, bracketTaxes } = calcFederalTax(taxableIncome, brackets[filingStatus], brackets.rates);

    // FICA (Social Security 6.2% up to $168,600 for 2024, Medicare 1.45%)
    const sswageCap = taxYear === 2024 ? 168600 : 160200;
    const socialSecurity = Math.min(grossIncome, sswageCap) * 0.062;
    const medicare = grossIncome * 0.0145;
    const additionalMedicare = grossIncome > 200000 ? (grossIncome - 200000) * 0.009 : 0;
    const ficaTax = socialSecurity + medicare + additionalMedicare;

    const totalTax = federalTax + ficaTax;
    const effectiveRate = totalIncome > 0 ? (federalTax / totalIncome * 100) : 0;
    const marginalRate = brackets.rates[brackets[filingStatus].findIndex(b => taxableIncome <= b)] ?? 0.37;
    const takeHomePay = grossIncome - federalTax - ficaTax - preTaxDed;

    document.getElementById('taxResult').innerHTML = `
        <h3>Estimated Federal Tax: $${federalTax.toFixed(2)}</h3>
        <p><strong>AGI:</strong> $${agi.toLocaleString()}</p>
        <p><strong>Taxable Income:</strong> $${taxableIncome.toLocaleString()}</p>
        <p><strong>Deduction Used:</strong> $${deduction.toLocaleString()} (${deductionType === 'standard' ? 'Standard' : 'Itemized'})</p>
        <p><strong>Social Security Tax:</strong> $${socialSecurity.toFixed(2)}</p>
        <p><strong>Medicare Tax:</strong> $${(medicare + additionalMedicare).toFixed(2)}</p>
        <p><strong>Total Tax (Fed + FICA):</strong> $${totalTax.toFixed(2)}</p>
        <p><strong>Effective Federal Rate:</strong> ${effectiveRate.toFixed(2)}%</p>
        <p><strong>Marginal Rate:</strong> ${(marginalRate * 100).toFixed(0)}%</p>
        <p><strong>Estimated Take-Home Pay:</strong> $${takeHomePay.toFixed(2)}</p>`;

    // Income breakdown donut
    if (taxBreakdownChart) taxBreakdownChart.destroy();
    const taxBreakCtx = document.getElementById('taxBreakdownChart').getContext('2d');
    taxBreakdownChart = new Chart(taxBreakCtx, {
        type: 'doughnut',
        data: {
            labels: ['Take-Home Pay', 'Federal Income Tax', 'Social Security', 'Medicare'],
            datasets: [{
                data: [Math.max(takeHomePay, 0).toFixed(2), federalTax.toFixed(2), socialSecurity.toFixed(2), (medicare + additionalMedicare).toFixed(2)],
                backgroundColor: ['rgba(40,167,69,0.8)', 'rgba(220,53,69,0.8)', 'rgba(255,193,7,0.8)', 'rgba(23,162,184,0.8)'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Income Breakdown' }
            }
        }
    });

    // Tax per bracket bar chart
    if (taxBracketsChart) taxBracketsChart.destroy();
    const taxBracketsCtx = document.getElementById('taxBracketsChart').getContext('2d');
    const rateLabels = ['10%', '12%', '22%', '24%', '32%', '35%', '37%'];
    taxBracketsChart = new Chart(taxBracketsCtx, {
        type: 'bar',
        data: {
            labels: rateLabels,
            datasets: [{
                label: 'Tax Paid Per Bracket',
                data: bracketTaxes.map(t => t.toFixed(2)),
                backgroundColor: [
                    'rgba(40,167,69,0.7)', 'rgba(23,162,184,0.7)', 'rgba(255,193,7,0.7)',
                    'rgba(253,126,20,0.7)', 'rgba(220,53,69,0.7)', 'rgba(111,66,193,0.7)', 'rgba(52,58,64,0.7)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Tax Paid Per Bracket' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => '$' + parseFloat(v).toLocaleString() }
                }
            }
        }
    });
});
