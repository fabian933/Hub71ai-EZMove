export const formatDate = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const formatAED = (value: number) => `AED ${value.toLocaleString("en-US")}`;
