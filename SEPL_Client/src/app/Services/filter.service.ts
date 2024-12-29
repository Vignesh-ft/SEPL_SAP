import { Injectable } from '@angular/core';

interface DataPoint {
  date: string;        // Example: '2024-07-21T18:30:00.000Z'
  cycle_time_end: string; // Example: '10:41:00'
  shift: string;       // Example: 'A'
  stator_count: number;
  rotor_count: number;
  model: string;
  variant: string;
}

@Injectable({
  providedIn: 'root'
})
export class FilterService {

  // Function to filter and aggregate data by hour
  hourFilter(data: any): any {
    let hourlySums: { hour: string, rotor_sum: number, stator_sum: number }[] = [];
    let hourlyLabels: string[] = [];

    data.map((datum: any) => {
        let hour = datum.cycle_time_end.split(":")[0]; // Extract hour from time

        // Check if this hour already exists in the array
        let existingHour = hourlySums.find((entry) => entry.hour === hour);
        if (existingHour) {
            // If hour exists, update the sums for rotor and stator counts
            existingHour.rotor_sum += datum.rotor_count;
            existingHour.stator_sum += datum.stator_count;
        } else {
            // If hour does not exist, create a new entry
            hourlySums.push({ hour, rotor_sum: datum.rotor_count, stator_sum: datum.stator_count });
            hourlyLabels.push(Number(hour) <10 ? `0${hour}:00`: `${hour}:00`);  // Add hour to the labels array
        }
    });

    return { hourlyLabels: hourlyLabels, hourlySums: hourlySums };
  }

  // Function to filter and aggregate data by day
  dayFilter(data: any): any {
    let dailySums: { day: string, rotor_sum: number, stator_sum: number }[] = [];
    let dailyLabels: string[] = [];

    data.map((datum: any) => {
      // Ensure datum.date is in the correct format
      if (datum.date) {
        // Split the date and time from 'T'
        let [date, _] = datum.date.split("T");
        // console.log(date);  // Log to ensure we are correctly extracting the date part

        // Check if the date format is correct
        if (date) {
          // Directly use date as the dayLabel without splitting it further
          let dayLabel = date; // "YYYY-MM-DD" format

          // Check if this day already exists in the array
          let existingDay = dailySums.find((entry) => entry.day === dayLabel);
          if (existingDay) {
            // If day exists, update the sums for rotor and stator counts
            existingDay.rotor_sum += datum.rotor_count;
            existingDay.stator_sum += datum.stator_count;
          } else {
            // If day does not exist, create a new entry
            dailySums.push({ day: dayLabel, rotor_sum: datum.rotor_count, stator_sum: datum.stator_count });
            dailyLabels.push(dayLabel);  // Add the formatted day to the labels array
          }
        }
      }
    });

    // Return the final result
    return { dailyLabels: dailyLabels, dailySums: dailySums };
  }


  // Function to filter and aggregate data by month
  monthFilter(data: any): any {
    let monthlySums: Map<string, { rotor_sum: number, stator_sum: number }> = new Map();
    let monthlyLabels: string[] = [];

    // Month names for the label format
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    data.map((datum: any) => {
      // Split date and time from datum.date (e.g., "2024-07-21T18:30:00.000Z")
      let [date, temp1] = datum.date.split("T");  // Split the string at "T"
      let [year, month, _] = date.split("-");  // Extract year, month, and day
      let monthName = monthNames[parseInt(month, 10) - 1];  // Convert month number to name
      let monthLabel = `${monthName} - ${year}`;  // Format as "MonthName - Year"

      // Check if the month already exists in the Map
      if (monthlySums.has(monthLabel)) {
        // If month exists, update the sums for rotor and stator counts
        let existingMonth = monthlySums.get(monthLabel);
        existingMonth!.rotor_sum += datum.rotor_count;
        existingMonth!.stator_sum += datum.stator_count;
      } else {
        // If month does not exist, create a new entry
        monthlySums.set(monthLabel, { rotor_sum: datum.rotor_count, stator_sum: datum.stator_count });
        monthlyLabels.push(monthLabel);  // Add the formatted month to the labels array
      }
    });

    // Convert Map to an array for return
    let monthlySumsArray = Array.from(monthlySums, ([month, { rotor_sum, stator_sum }]) => ({
      month,
      rotor_sum,
      stator_sum
    }));

    return { monthlyLabels: monthlyLabels, monthlySums: monthlySumsArray };
  }


  // Function to filter and aggregate data by shift and date
  shiftFilter(data: any): any {
    let shiftDateSums: { date_shift: string, rotor_sum: number, stator_sum: number }[] = [];
    let shiftDateLabels: string[] = [];

    // Iterate over the data array
    data.map((datum: any) => {
      // Extract the date from datum.date (e.g., "2024-07-21T18:30:00.000Z" -> "2024-07-21")
      let [date, _] = datum.date.split("T");  // Split by "T" to get the date part
      let dateLabel = `${date}`;  // Just use the date part (e.g., "2024-07-21")

      // Combine date and shift for the label (e.g., "2024-07-21 Shift A")
      let dateShiftLabel = `${dateLabel} Shift ${datum.shift}`;

      // Check if this date + shift combination already exists in the array
      let existingShiftDate = shiftDateSums.find((entry) => entry.date_shift === dateShiftLabel);

      if (existingShiftDate) {
        // If the combination exists, update the sums for rotor and stator counts
        existingShiftDate.rotor_sum += datum.rotor_count;
        existingShiftDate.stator_sum += datum.stator_count;
      } else {
        // If the combination doesn't exist, create a new entry
        shiftDateSums.push({
          date_shift: dateShiftLabel,
          rotor_sum: datum.rotor_count,
          stator_sum: datum.stator_count,
        });
        shiftDateLabels.push(dateShiftLabel); // Add the label to the labels array
      }
    });

    return { shiftLabels: shiftDateLabels, shiftSums: shiftDateSums };
  }



}
