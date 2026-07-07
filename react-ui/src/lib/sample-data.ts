export const metrics = [
  { label: "Средняя энергия", value: "7.4", note: "Последние 7 дней", trend: "+0.6" },
  { label: "Риск перегруза", value: "Средний", note: "2 тяжелых дня на неделе", trend: "−1 день" },
  { label: "Deep Work", value: "6", note: "Задач на текущую неделю", trend: "45%" },
  { label: "Фокус", value: "8.1", note: "Лучше во вторник и среду", trend: "+0.9" }
];

export const insights = [
  {
    title: "Лучшее окно для сложных задач",
    body: "Энергия и фокус стабильно выше утром. Deep Work лучше ставить на первые два блока дня."
  },
  {
    title: "Сигнал перегруза",
    body: "После дней с высокой эмоциональной нагрузкой стресс растет. Планируй мягкий день следом."
  }
];

export const tasks = [
  {
    title: "Подготовить квартальный обзор",
    subtitle: "Deep Work • 90 мин • Высокий приоритет",
    status: "In focus"
  },
  {
    title: "Разобрать входящие вопросы команды",
    subtitle: "Admin • 35 мин • Средний приоритет",
    status: "Scheduled"
  },
  {
    title: "Собрать инсайты по ретро",
    subtitle: "Creative • 60 мин • Высокий приоритет",
    status: "Recovery buffer"
  }
];

export const loadSeries = [
  { day: "Пн", load: 48, energy: 7.2, stress: 4.1 },
  { day: "Вт", load: 62, energy: 7.8, stress: 4.6 },
  { day: "Ср", load: 58, energy: 6.9, stress: 5.3 },
  { day: "Чт", load: 72, energy: 5.4, stress: 6.8 },
  { day: "Пт", load: 41, energy: 6.1, stress: 4.9 }
];
