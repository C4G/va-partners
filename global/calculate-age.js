/**
 * Calculates the age of a person based on their birth date
 * If the person is less than a year old, the age is returned in months
 * @param {string} birthDate 
 * @returns 
 */
export const calculateAge = (birthDateString) => {
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let years = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  const dayDifference = today.getDate() - birthDate.getDate();

  // If birth month hasn't occurred yet this year, or it's the birth month but the birthday hasn't occurred yet, adjust year count
  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
      years--;
  }

  // If years is 0, calculate months
  if (years === 0) {
      let months = monthDifference;
      if (dayDifference < 0) {
          months--;
      }
      if (months < 0) {
          months += 12;
      }
      return `${months} months`;
  }

  return years;
}