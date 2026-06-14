declare module 'moment-jalaali' {
  import { Moment } from 'moment';
  
  interface MomentJalaali extends Moment {
    jYear(): number;
    jMonth(): number;
    jDate(): number;
    jDaysInMonth(year: number, month: number): number;
    jMonths(): string[];
  }
  
  function momentJalaali(input?: any, format?: string): MomentJalaali;
  namespace momentJalaali {
    function jDaysInMonth(year: number, month: number): number;
    function jMonths(): string[];
  }
  
  export = momentJalaali;
}
