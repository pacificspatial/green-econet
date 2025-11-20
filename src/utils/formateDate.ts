export const formatDate = (dateString: string): string => {
  const date = new Date(dateString); // Parse the date string into a Date object

  const day = String(date.getDate()).padStart(2, "0"); // Add leading zero if day < 10
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Get month (1-based index)
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};
