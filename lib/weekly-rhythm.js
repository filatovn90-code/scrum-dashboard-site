export function summarizeWeek({ tasks = [], checkins = [], days = [] }) {
  const completed = tasks.filter((task) => task.status === "done").length;
  const busiest = days.filter((day) => day.tasks?.length)
    .reduce((best, day) => !best || day.loadValue > best.loadValue ? day : best, null);
  return { completed, open: tasks.length - completed, checkins: checkins.length, busiest };
}
