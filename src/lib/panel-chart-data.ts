// This is mock data for demonstration purposes.
// In a real application, this would come from an API.

type DayResult = {
  openPanna: string;
  jodi: string;
  closePanna: string;
  isRed: boolean;
};

type WeekData = {
  dateRange: string;
  results: (DayResult | null)[];
};

function generateRandomNumber(digits: number) {
    return Math.floor(Math.random() * Math.pow(10, digits)).toString().padStart(digits, '0');
}

function generatePanna() {
    let panna = '';
    while (true) {
        const digits = [
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 10)
        ].sort((a, b) => a - b);
        
        if (digits[0] !== digits[1] || digits[1] !== digits[2]) {
             panna = digits.join('');
             if(panna !== '000') break;
        }
    }
    return panna;
}


function getPannaSum(panna: string) {
    return panna.split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0) % 10;
}

function generateDayResult(): DayResult {
    const openPanna = generatePanna();
    const closePanna = generatePanna();
    
    const openDigit = getPannaSum(openPanna);
    const closeDigit = getPannaSum(closePanna);
    
    const jodi = `${openDigit}${closeDigit}`;
    const isRed = openDigit === closeDigit;

    return {
        openPanna,
        jodi,
        closePanna,
        isRed
    };
}


export function getPanelChartData(): WeekData[] {
  const data: WeekData[] = [];
  const startDate = new Date("2023-01-02"); // First Monday of 2023

  // Header row
  data.push({
    dateRange: "Date",
    results: [null, null, null, null, null, null],
  })

  for (let i = 0; i < 52; i++) {
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + i * 7);

    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 5);

    const dateRange = `${weekStartDate.getDate().toString().padStart(2, "0")}/${(weekStartDate.getMonth() + 1).toString().padStart(2, "0")}/${weekStartDate.getFullYear().toString().slice(-2)} to ${weekEndDate.getDate().toString().padStart(2, "0")}/${(weekEndDate.getMonth() + 1).toString().padStart(2, "0")}/${weekEndDate.getFullYear().toString().slice(-2)}`;
    
    const results: (DayResult | null)[] = [];
    for (let j = 0; j < 6; j++) {
         // Simulate some days being off
        if (Math.random() > 0.05) {
            results.push(generateDayResult());
        } else {
            results.push(null);
        }
    }

    data.push({
      dateRange,
      results
    });
  }

  return data;
}
