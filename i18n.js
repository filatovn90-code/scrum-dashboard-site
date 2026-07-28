export const supportedLocales = ["ru", "en"];
export const defaultLocale = "ru";
export const localeLabels = {
  ru: "Русский",
  en: "English"
};

const LOCALE_STORAGE_KEY = "mindpulse_locale";
const LOCALE_COOKIE_KEY = "mindpulse_locale";
const listeners = new Set();

const messages = {
  ru: {
    brand: {
      name: "MindPulse",
      kicker: "MindPulse",
      title: "ИИ-платформа энергии"
    },
    common: {
      language: "Язык",
      russian: "Русский",
      english: "English",
      select: "Выбрать",
      choose: "Выбрать",
      fullName: "Имя и фамилия",
      timezone: "Часовой пояс",
      loading: "Загрузка...",
      saving: "Сохранение...",
      save: "Сохранить",
      cancel: "Отмена",
      close: "Закрыть",
      email: "Email",
      password: "Пароль",
      timezonePlaceholder: "Часовой пояс, например Europe/Moscow",
      fullNamePlaceholder: "Имя и фамилия",
      user: "Пользователь",
      appRhythm: "Личный рабочий ритм"
    },
    navigation: {
      features: "Возможности",
      howItWorks: "Как это работает",
      pricing: "Тарифы",
      login: "Войти",
      startFree: "Начать бесплатно",
      openApp: "В рабочее пространство",
      pulse: "Пульс дня",
      plan: "Моя неделя",
      analytics: "Аналитика",
      profile: "Профиль",
      settings: "Настройки",
      billing: "Тариф и оплата",
      help: "Помощь",
      logout: "Выйти",
      menu: "Меню",
      closeMenu: "Закрыть меню",
      publicNav: "Публичная навигация",
      appNav: "Навигация приложения",
      userMenu: "Открыть меню пользователя"
    },
    public: {
      heroKicker: "AI ENERGY OS ДЛЯ KNOWLEDGE WORKERS",
      heroTitle: "Планируй задачи не только по срокам, но и по своей энергии.",
      heroDescription: "MindPulse помогает планировать задачи с учетом доступной емкости дня, когнитивной и эмоциональной нагрузки. Система показывает, когда план реалистичен, а когда лучше снизить темп.",
      heroPrimaryCta: "Начать бесплатно",
      heroSecondaryCta: "Посмотреть, как работает",
      trustLine: "Не еще один список задач. Система управления рабочей емкостью.",
      compareKicker: "Почему продукт ощущается иначе",
      compareTitle: "Почему MindPulse отличается",
      compareDefaultTitle: "Обычный таск-трекер",
      compareMindpulseTitle: "MindPulse",
      compareDefault1: "Задачи",
      compareDefault2: "Дедлайны",
      compareDefault3: "Приоритеты",
      compareDefault4: "Календарь",
      compareMindpulse1: "Задачи",
      compareMindpulse2: "Доступная емкость дня",
      compareMindpulse3: "Когнитивная нагрузка",
      compareMindpulse4: "Эмоциональная нагрузка",
      compareMindpulse5: "Риск перегруза",
      compareMindpulse6: "Персональные рекомендации",
      benefitsKicker: "Что это дает",
      benefitsTitle: "Работай устойчиво, а не на пределе",
      benefit1Title: "Реалистичный план",
      benefit1Body: "Планируй задачи в пределах доступной емкости дня.",
      benefit2Title: "Защита от перегруза",
      benefit2Body: "Видишь перегруз до того, как он повлияет на состояние.",
      benefit3Title: "Лучшее время для сложной работы",
      benefit3Body: "Ставь Deep Work в периоды, когда на него действительно есть ресурс.",
      benefit4Title: "Персональные закономерности",
      benefit4Body: "Понимай, какие задачи и рабочие ритмы помогают сохранять фокус.",
      howKicker: "Как это работает",
      howTitle: "Как это работает",
      step1Title: "Оцени состояние",
      step1Body: "Укажи энергию, стресс и фокус.",
      step2Title: "Составь план",
      step2Body: "Распредели задачи по дням.",
      step3Title: "Сверь нагрузку с емкостью",
      step3Body: "MindPulse показывает, насколько план реалистичен.",
      step4Title: "Корректируй план",
      step4Body: "Переноси или упрощай задачи до наступления перегруза.",
      pulseKicker: "Пульс дня",
      pulseTitle: "Начинай день с оценки доступной емкости",
      pulseBody: "Пульс дня учитывает энергию, стресс и фокус. Полученная емкость используется для оценки загрузки плана.",
      weekKicker: "План недели",
      weekTitle: "Видишь нагрузку прямо в плане недели",
      weekBody: "Каждый день показывает Пульс, запланированную нагрузку и оставшийся резерв. При добавлении или переносе задач показатели обновляются автоматически.",
      analyticsKicker: "Аналитика",
      analyticsTitle: "Понимай свои рабочие закономерности",
      analyticsBody: "Аналитика показывает связь между состоянием, типами задач и перегрузом. Со временем рекомендации становятся более персональными.",
      pricingTitle: "Тарифы",
      pricingKicker: "Тарифы",
      pricingSubtitle: "Выбирай удобный темп входа: ценность доступна уже в бесплатной версии, а Pro готовит более глубокую персональную аналитику.",
      freePlanTitle: "Free",
      freePlan1: "Задачи и проекты",
      freePlan2: "Пульс дня",
      freePlan3: "План недели",
      freePlan4: "Базовая аналитика",
      freePlan5: "Rule-based рекомендации",
      proPlanTitle: "Pro",
      proPlan1: "Расширенная AI-аналитика",
      proPlan2: "Персональные закономерности",
      proPlan3: "AI Weekly Review",
      proPlan4: "Глубокие рекомендации",
      proPlan5: "Полная история",
      freeNow: "Доступен сейчас",
      comingSoon: "Скоро",
      faqKicker: "FAQ",
      faqTitle: "Частые вопросы",
      faq1: "Чем MindPulse отличается от обычного таск-трекера?",
      faq1Body: "MindPulse показывает не только список задач, но и доступную емкость дня, рабочую плотность и риск перегруза.",
      faq2: "Нужно ли каждый день заполнять Пульс?",
      faq2Body: "Желательно, но не обязательно. Чем регулярнее оценка состояния, тем точнее готовность дня и рекомендации.",
      faq3: "Как рассчитывается нагрузка задач?",
      faq3Body: "Нагрузка собирается из типа задачи, когнитивной и эмоциональной нагрузки. Эти данные затем сопоставляются с емкостью дня.",
      faq4: "Можно ли использовать MindPulse бесплатно?",
      faq4Body: "Да. Бесплатный план уже включает задачи, Пульс дня, План недели и базовую аналитику.",
      faq5: "Мои данные приватны?",
      faq5Body: "Да. Каждая учетная запись работает со своим изолированным набором данных через Supabase.",
      faq6: "Есть ли английский язык?",
      faq6Body: "Да. Интерфейс MindPulse работает на русском и английском.",
      footerProduct: "Продукт",
      footerAccount: "Аккаунт",
      footerDocs: "Документы",
      footerLanguage: "Язык",
      privacy: "Политика конфиденциальности",
      terms: "Условия использования",
      copyright: "© 2026 MindPulse"
    },
    auth: {
      signInKicker: "Вход",
      signInTitle: "Добро пожаловать обратно",
      signInBody: "Войдите, чтобы открыть личный трекер, проекты и оценку состояния.",
      signUpKicker: "Регистрация",
      signUpTitle: "Откройте личное приложение",
      signUpBody: "После регистрации профиль будет создан автоматически, а вы сразу попадёте в защищённую зону.",
      forgotKicker: "Восстановление",
      forgotTitle: "Сбросить пароль",
      forgotBody: "Введите email, и Supabase отправит письмо для восстановления доступа.",
      repeatPassword: "Повторите пароль",
      createAccount: "Создать аккаунт",
      forgotPassword: "Забыли пароль?",
      resetPassword: "Отправить письмо",
      alreadyHaveAccount: "Уже есть аккаунт?",
      loginIdle: "Введите email и пароль.",
      signupIdle: "Используйте email, с которым будете дальше входить в приложение.",
      forgotIdle: "Готово к отправке письма.",
      checking: "Проверяю данные...",
      signingIn: "Вход выполнен. Перенаправляю в приложение...",
      creatingAccount: "Создаю аккаунт...",
      accountCreated: "Аккаунт создан. Перенаправляю в приложение...",
      sendingReset: "Отправляю письмо...",
      resetSent: "Письмо отправлено. Проверьте почту."
    },
    authErrors: {
      remoteUnavailable: "Не удалось связаться с сервером входа. Проверьте, что Supabase-проект активен и сайт открыт по публичной ссылке.",
      emailNotConfirmed: "Почта для этого аккаунта ещё не подтверждена. Откройте письмо от Supabase и подтвердите email.",
      invalidCredentials: "Аккаунт не найден или пароль неверный.",
      sessionPersistence: "Вход прошёл, но сессия не сохранилась. Обычно это связано с настройками домена, Redirect URL или переменных окружения.",
      userAlreadyRegistered: "Такой email уже зарегистрирован. Попробуйте войти.",
      signupEmailNotConfirmed: "Аккаунт создан, но email ещё не подтверждён. Подтвердите почту по письму от Supabase.",
      emailRateLimit: "Слишком много попыток регистрации подряд. Подождите несколько минут или используйте другой email.",
      weakPassword: "Пароль слишком короткий. Используйте более длинный пароль.",
      sessionPersistenceSignup: "Регистрация прошла, но сессия не сохранилась. Обычно это связано с настройками домена, Redirect URL или переменных окружения."
    },
    pulse: {
      pageTitle: "Пульс дня",
      pageSubtitle: "Ежедневная оценка состояния, готовность к дню и устойчивый рабочий ритм без лишней перегрузки.",
      checkinKicker: "Оценка дня",
      checkinTitle: "Как ты сегодня?",
      checkinCopy: "Оцени состояние перед планированием дня.",
      energyTitle: "Энергия",
      energyHint: "Сколько сил сегодня?",
      stressTitle: "Стресс",
      stressHint: "Насколько напряженно себя чувствуешь?",
      focusTitle: "Фокус",
      focusHint: "Насколько легко концентрироваться?",
      sleep: "Сон",
      mood: "Настроение",
      sleepBad: "Плохо",
      sleepNormal: "Нормально",
      sleepGood: "Хорошо",
      moodCalm: "Спокойное",
      moodNeutral: "Нейтральное",
      moodAnxious: "Тревожное",
      moodIrritated: "Раздраженное",
      moodInspired: "Воодушевленное",
      moodTired: "Уставшее",
      saveState: "Сохранить состояние",
      idleStatus: "Можно сохранить состояние за сегодня.",
      emptyStatus: "Заполни состояние дня, чтобы рекомендации стали точнее.",
      loadingStatus: "Загружаю Пульс дня...",
      loadedStatus: "Данные за сегодня загружены.",
      savingStatus: "Сохраняю состояние...",
      savedStatus: "Состояние сохранено.",
      loadError: "Не удалось открыть экран Пульс дня.",
      migrationDailyCheckins: "В Supabase пока нет таблицы {table}. Сначала выполни SQL-миграции из папки supabase.",
      migrationColumns: "Для экрана Пульс дня нужно обновить структуру таблицы {table} в Supabase.",
      readinessKicker: "Готовность",
      readinessTitle: "Готовность дня",
      readinessCopy: "Насколько день подходит для сложной работы с учетом состояния и текущей нагрузки.",
      energyDebt: "Энергетический долг",
      energyDebtEmpty: "Метрика появится после нескольких дней использования.",
      bestForToday: "Что лучше делать сегодня"
    },
    plan: {
      pageTitle: "План недели",
      pageSubtitle: "Вся неделя целиком: задачи по дням, рабочая плотность и фокус на главном.",
      boardKicker: "План недели",
      boardTitle: "План недели",
      week: "Неделя",
      day: "День",
      focusKicker: "Фокус дня",
      focusTitle: "Фокус на день",
      add: "Добавить",
      addTaskPlaceholder: "Задача",
      focusItemPlaceholder: "Пункт {index}",
      pulse: "Пульс",
      pulseNotAssessed: "Пульс не оценён",
      dayAssessed: "День оценён",
      plan: "План",
      availableLoad: "Доступная нагрузка",
      plannedLoad: "Запланировано",
      overloadBy: "Превышение",
      remaining: "Осталось",
      baseCapacity: "Базовая ёмкость",
      noteHeavy: "Лучше не добавлять ещё одну тяжёлую задачу.",
      noteLightOnly: "Осталось место только для лёгкой задачи.",
      noteManageable: "День выглядит управляемым.",
      noteDense: "День становится плотнее, но пока выглядит управляемым.",
      noteOverloaded: "День уже выглядит перегруженным. Лучше перенести часть нагрузки.",
      totalTasks: "Всего задач",
      deepWork: "Глубокая работа",
      cognitiveHeavy: "Когнитивно тяжёлые",
      emotionalHeavy: "Эмоционально тяжёлые",
      pickWeek: "Выбрать неделю",
      pickDay: "Выбрать день",
      todayFocus: "Фокус на сегодня",
      status: "Статус",
      taskType: "Тип задачи",
      cognitive: "Когнитивная",
      emotional: "Эмоциональная",
      overallLoad: "Общая нагрузка",
      saveTask: "Сохранить",
      addTask: "Добавить",
      taskPlanned: "Запланировано",
      taskInProgress: "В работе",
      taskDone: "Сделано",
      editTask: "Редактировать",
      deleteTask: "Удалить",
      pulseTooltipAssessed: "Пульс дня\nДоступная нагрузка: {capacity}\nЗапланировано: {planned}\n{restLine}",
      pulseTooltipUnassessed: "Пульс дня\nПульс не оценён\nЗапланировано: {planned}\nБазовая ёмкость: {capacity}",
      pulseOverByLine: "Превышение: {value}",
      pulseRemainingLine: "Осталось: {value}",
      tasksForWeek: "На выбранную неделю",
      deepWorkTasks: "Задачи глубокой концентрации",
      cognitiveHeavyTasks: "С нагрузкой 4/5 и выше",
      emotionalHeavyTasks: "С нагрузкой 4/5 и выше"
    },
    analytics: {
      pageTitle: "Аналитика",
      pageSubtitle: "Связь состояния, нагрузки и темпа работы без лишней тревоги — с фокусом на понятные выводы.",
      heroKicker: "Персональная аналитика энергии",
      heroTitle: "Связь состояния, нагрузки и темпа работы",
      heroBody: "Здесь видно, как задачи влияют на энергию, стресс и фокус. Это помогает раньше замечать риск перегруза и собирать более устойчивый ритм недели.",
      periodAnalysis: "Период анализа",
      periodSlice: "Срез по состоянию и задачам",
      period: "Период",
      weeklySummary: "Сводка недели",
      weeklyInsightsTitle: "Главные инсайты недели",
      weeklyInsightsBody: "Сначала смысловые выводы по состоянию и задачам, а ниже — графики и детализация.",
      mainTakeaways: "Ключевые выводы",
      weeklyReviewKicker: "Обзор недели",
      weeklyReviewTitle: "Обзор недели",
      weeklyReviewBody: "Соберите персональный обзор недели на основе состояния, нагрузки и задач за выбранный период.",
      generateReview: "Сформировать обзор недели",
      reviewPlaceholder: "Обзор появится после нажатия на кнопку. Он собирается из ваших оценок состояния и задач за выбранный период.",
      stateTrendKicker: "Динамика состояния",
      stateBadge: "Энергия / стресс / фокус",
      taskLoadKicker: "Нагрузка задач",
      taskLoadBadge: "Нагрузка",
      debtKicker: "Энергетический долг",
      weeklyTrendBadge: "Динамика недели",
      connectionsKicker: "Связи",
      connectionsTitle: "Что влияло на состояние",
      taskTypesKicker: "Типы задач",
      taskTypesTitle: "Какие задачи нагружают сильнее всего",
      overloadTrendKicker: "Тренд перегруза",
      overloadTrendTitle: "Тренд перегруза",
      nextWeekKicker: "Следующая неделя",
      loadStateTitle: "Состояние по дням",
      loadTaskTitle: "Нагрузка по дням",
      debtTitle: "Энергетический долг за неделю",
      recommendationsTitle: "Рекомендации",
      periodThisWeek: "Эта неделя",
      periodLastWeek: "Прошлая неделя",
      periodLast14Days: "Последние 14 дней",
      periodLast30Days: "Последние 30 дней",
      loading: "Загружаю аналитику...",
      refreshError: "Не удалось обновить аналитику.",
      askAi: "Спросить ИИ",
      aiProLocked: "ИИ-помощник — Pro",
      aiKicker: "ИИ-помощник",
      aiTitle: "Спросить ИИ",
      aiIntro: "Можно спросить, что видно по аналитике и как интерпретировать состояние, нагрузку и фокус.",
      aiPlaceholder: "Напишите вопрос...",
      aiStatus: "Можно задать вопрос по состоянию, энергии и задачам.",
      aiSend: "Отправить",
      noState: "Пока нет данных о состоянии.",
      goToPulse: "Перейти в Пульс дня",
      stateHint: "Показатели появятся после нескольких заполнений оценки дня.",
      energyLegend: "Энергия",
      stressLegend: "Стресс",
      focusLegend: "Фокус",
      stateInsightDown: "К концу периода энергия снижалась. Полезно разгружать вторую половину недели и не складывать туда самые тяжелые задачи.",
      stateInsightStress: "Стресс в среднем повышен. Хорошо работает чередование сложных дней с более спокойными блоками.",
      stateInsightStable: "Состояние выглядит относительно ровным. Чем стабильнее оценка дня, тем точнее будут рекомендации по нагрузке.",
      noTasks: "Пока нет задач за выбранный период.",
      goToPlan: "Перейти в Мою неделю",
      loadHint: "Когда появятся задачи, здесь будет видно, в какие дни нагрузка выше и где лучше разгружать расписание.",
      busiestDay: "Самый загруженный день: {weekday}, {date}. Суммарная нагрузка — {load}.",
      noBusiestDay: "Пока недостаточно задач, чтобы выделить самый загруженный день.",
      debtHint: "Сначала нужны несколько оценок состояния и задачи за несколько дней подряд.",
      debtHigh: "Последние дни уже накапливают энергетический долг. Лучше снижать плотность недели и добавлять восстановительные блоки.",
      debtWatch: "Нагрузка уже начинает накапливаться. Стоит следить за тяжелыми днями и оставлять паузы после сложных задач.",
      debtHealthy: "Ритм пока выглядит устойчивым: сильного накопления энергетического долга не видно.",
      insightLoadStress: "В дни с высокой суммарной нагрузкой стресс тоже был выше.",
      insightLowEnergyHeavy: "В дни с низкой энергией оставалось много задач с высокой когнитивной нагрузкой. Это повышает риск перегруза.",
      insightFocusModerate: "Лучший фокус чаще проявлялся в дни с умеренной, а не перегруженной нагрузкой.",
      insightEmotionType: "Основную эмоциональную нагрузку в этот период создавали задачи типа «{type}».",
      insightFewData: "Пока данных недостаточно для уверенных выводов. Продолжай заполнять состояние и вести задачи несколько дней подряд.",
      insightEmpty: "Аналитика появится после нескольких дней использования трекера.",
      typeAvgCognitive: "Средняя когнитивная: {value}",
      typeAvgEmotional: "Средняя эмоциональная: {value}",
      typeAvgLoad: "Средняя нагрузка: {value}",
      typeDominant: "{type} занимает {percent}% задач периода и формирует основную часть рабочей нагрузки.",
      overloadCurrent: "Текущий статус",
      overloadDays: "{riskDays} дней с риском перегруза • {highDays} дней с высокой нагрузкой",
      recommendationStable: "Сейчас ритм выглядит устойчивым. Старайся держать умеренный объем сложных задач и не забывать про восстановление.",
      weeklyReviewEmpty: "Пока данных мало для обзора недели. Сначала добавьте задачи и заполните состояние дня хотя бы несколько раз.",
      weeklyReviewPrompt: "Нажмите «Сформировать обзор недели», и здесь появится персональный текстовый отчет по состоянию, нагрузке и задачам.",
      weeklyReviewLoading: "Собираю обзор недели...",
      weeklyReviewPro: "Pro ИИ",
      weeklyReviewCache: "Сохранённый ИИ-обзор",
      weeklyReviewNoData: "Пока обзор недели собрать не из чего: сначала нужны несколько оценок состояния и задачи за выбранный период.",
      weeklyReviewStateSummary: "За период средняя энергия была {energy}, стресс — {stress}, а фокус — {focus}.",
      weeklyReviewStateFew: "За период пока мало оценок состояния, поэтому обзор строится в основном по структуре задач и нагрузке.",
      weeklyReviewCompleted: "Что получилось: завершено {count} {tasksWord}. Это хороший признак, что план хотя бы частично совпадал с реальной емкостью недели.",
      weeklyReviewCompletedFew: "Что получилось: пока закрытых задач немного, значит стоит внимательнее смотреть на объем плана и приоритеты дня.",
      weeklyReviewHeavyDays: "Что перегружало: самыми тяжелыми были {days}. В эти дни суммарная нагрузка выходила выше комфортного диапазона.",
      weeklyReviewHeavyDaysNone: "Что перегружало: явных дней перегруза почти не видно, ритм недели выглядит относительно ровным.",
      weeklyReviewTopTasks: "Больше всего энергии забрали задачи: {tasks}.",
      weeklyReviewDebt: "Энергетический долг на конец периода — {value}. Это значит: {label}.",
      weeklyReviewNext: "На следующей неделе полезно оставить меньше тяжелых задач в самые плотные дни и заранее добавить восстановительные блоки после сложной коммуникации или глубокой работы.",
      energyAverage: "Средняя энергия",
      stressAverage: "Средний стресс",
      focusAverage: "Средний фокус",
      checkinAppears: "Появляется после оценки дня",
      checkinAppearsLater: "Появится после нескольких заполнений состояния",
      overloadRisk: "Риск перегруза",
      overloadRiskLow: "Низкий",
      overloadRiskLowNote: "Ритм пока выглядит устойчивым.",
      overloadRiskMedium: "Средний",
      overloadRiskMediumNote: "Нагрузка требует внимания.",
      overloadRiskHigh: "Высокий",
      overloadRiskHighNote: "Неделя выглядит перегруженной.",
      weekSummaryLabel: "Наблюдение",
      weekSummaryFallbackTitle: "Инсайты появятся после нескольких дней данных",
      weekSummaryFallbackBody: "Когда появятся оценки состояния и задачи за несколько дней, здесь станут видны повторяющиеся закономерности.",
      weekSummaryLoadLabel: "Нагрузка",
      weekSummaryEmotionLabel: "Эмоции",
      weekSummaryFocusLabel: "Фокус",
      weekSummaryRecoveryLabel: "Восстановление"
    },
    profile: {
      pageTitle: "Профиль",
      pageSubtitle: "Данные аккаунта, имя, язык и таймзона для персональной настройки ритма работы.",
      kicker: "Профиль пользователя",
      title: "Ваши данные",
      save: "Сохранить профиль",
      loading: "Загружаю профиль...",
      ready: "Профиль можно обновить.",
      saved: "Профиль сохранён.",
      localeLabel: "Язык интерфейса",
      loadError: "Не удалось загрузить профиль.",
      saveProgress: "Сохраняю профиль...",
      saveError: "Не удалось сохранить профиль."
    },
    settings: {
      pageTitle: "Настройки",
      pageSubtitle: "Базовые системные настройки продукта будут собраны здесь по мере развития MindPulse.",
      title: "Язык и регион",
      body: "Пока основной системной настройкой является язык интерфейса. Позже сюда можно будет добавить регион, формат времени и другие параметры поведения продукта.",
      field: "Язык интерфейса",
      hint: "Выберите основной язык приложения.",
      save: "Сохранить настройки",
      saved: "Настройки сохранены.",
      loading: "Загружаю настройки...",
      ready: "Можно обновить язык интерфейса.",
      saveProgress: "Сохраняю настройки...",
      saveError: "Не удалось сохранить настройки."
    },
    pricing: {
      pageTitle: "Тарифы",
      heroKicker: "Подготовка к монетизации",
      heroTitle: "Фримиум-модель для ИИ-платформы энергии",
      heroBody: "Бесплатный план даёт ценность без внешнего ИИ: задачи, Пульс дня, оценку состояния, готовность дня, энергетический долг, базовую аналитику, базовые рекомендации и базовый обзор недели. Pro добавляет глубокий ИИ-разбор, ИИ-обзор недели, персональные паттерны, расширенные рекомендации и полную историю аналитики.",
      currentPlan: "Текущий план: Бесплатный",
      heroSide: "Оплата пока не подключена. Эта страница подготавливает продукт к монетизации и показывает границы между бесплатным и Pro-планом.",
      freeTitle: "Для ежедневного ритма без лишней сложности",
      proTitle: "Для глубокого ИИ-разбора и долгого роста",
      availableNow: "Доступно сейчас",
      comingSoon: "Скоро",
      startFree: "Начать бесплатно",
      paymentSoon: "Оплата скоро",
      compareTitle: "Что входит в каждый тариф",
      compareKicker: "Сравнение",
      feature: "Функция",
      yes: "Да",
      no: "—",
      currentGuestPlan: "Стартовый план: Бесплатный",
      free: "Бесплатный",
      pro: "Pro"
    },
    pricingFeature: {
      taskPlanning: "Планирование задач",
      dailyPulse: "Пульс дня",
      dailyCheckin: "Оценка дня",
      readinessScore: "Готовность дня",
      energyDebt: "Энергетический долг",
      ruleBasedCoach: "Базовые рекомендации",
      basicWeeklyReview: "Базовый обзор недели",
      basicAnalytics: "Базовая аналитика",
      deepAiCoach: "Глубокий ИИ-разбор",
      aiWeeklyReview: "ИИ-обзор недели",
      personalPatterns: "Персональные паттерны",
      overloadPrediction: "Прогноз перегруза",
      advancedRecommendations: "Расширенные рекомендации",
      aiRequests: "100 ИИ-запросов / месяц",
      fullHistory: "Полная история"
    },
    validation: {
      requiredEmail: "Введите email.",
      requiredPassword: "Введите пароль.",
      passwordMismatch: "Пароли не совпадают.",
      signInFailed: "Не удалось выполнить вход.",
      signUpFailed: "Не удалось создать аккаунт.",
      saveFailed: "Не удалось сохранить изменения",
      invalidEmail: "Введите корректный email",
      networkFailed: "Не удалось связаться с сервером."
    },
    taskTypes: {
      deep_work: "Глубокая работа",
      communication: "Коммуникация",
      creative: "Творческая",
      routine: "Рутина",
      learning: "Обучение",
      recovery: "Восстановление"
    },
    taskTypeDescriptions: {
      deep_work: "Глубокая работа и концентрация",
      communication: "Встречи, звонки, переговоры",
      creative: "Идеи, тексты, создание нового",
      routine: "Административные и повторяющиеся действия",
      learning: "Чтение, исследование, освоение нового",
      recovery: "Отдых, прогулка, спорт, пауза"
    },
    workload: {
      untitledTask: "Без названия",
      intensityLow: "Низкая",
      intensityMedium: "Средняя",
      intensityHigh: "Высокая",
      intensityVeryHigh: "Очень высокая",
      recoveryNote: "После этой задачи может быть полезна пауза около {minutes} минут.",
      readinessHigh: "Высокая готовность",
      readinessStable: "Стабильное состояние",
      readinessHeavy: "Тяжёлый день",
      readinessRisk: "Лучше снизить нагрузку",
      modeDeepWork: "Глубокая работа",
      modeAdmin: "Рутина",
      modeLightTasks: "Лёгкие задачи",
      modeRecovery: "Восстановление",
      readinessInfluences: "Сейчас на оценку дня больше всего влияют: {items}.",
      readinessFallback: "Пока план дня выглядит достаточно реалистично.",
      recNoCheckin: "Заполни состояние дня, чтобы рекомендации стали точнее.",
      recLowEnergyStress: "Сегодня лучше снизить нагрузку и оставить только самые важные задачи.",
      recTooMuchDeepWork: "День становится плотнее. Лучше ограничиться 1–2 задачами глубокой работы.",
      recHeavyCommunication: "Сегодня уже много эмоционально тяжёлой коммуникации. Полезно оставить между такими задачами время на переключение.",
      recEnergyDebt: "Последние дни ты работаешь в энергетический долг. Добавь восстановление или лёгкие задачи.",
      recTooManyOpenTasks: "План выглядит перегруженным. Попробуй сократить список задач дня или перенести часть работы.",
      recLowEnergy: "При текущем уровне энергии лучше начать с рутины или восстановления, а глубокую работу сократить.",
      recHighStress: "Сегодня стоит снизить количество эмоционально сложных коммуникаций.",
      recBalanced: "Пока день выглядит устойчивым. Оставь 1–2 главные задачи в фокусе и не перегружай вторую половину дня.",
      debtHealthy: "Устойчивый ритм",
      debtHealthyNote: "Ритм недели пока выглядит устойчивым.",
      debtWatch: "Стоит наблюдать",
      debtWatchNote: "Нагрузка копится, лучше внимательнее следить за разгрузкой.",
      debtFatigue: "Накопленная усталость",
      debtFatigueNote: "Последние дни уже выглядят довольно плотными.",
      debtOverloaded: "Рекомендуется снизить нагрузку",
      debtOverloadedNote: "Последние дни ты работаешь в энергетический долг. Лучше снизить нагрузку или добавить восстановление.",
      loadBalanced: "Сбалансировано",
      loadComfort: "Комфортная нагрузка",
      loadDense: "Плотный день",
      loadOverload: "Риск перегруза",
      dayCapacityFilled: "Лимит дня уже заполнен.",
      dayComfortable: "День выглядит комфортным для обычного ритма.",
      dayHasCapacity: "Есть хороший запас для ещё одной задачи.",
      heavyTasksCount: "Тяжёлых задач",
      baseCapacityShort: "обычных {value}"
    },
    taskStatus: {
      planned: "Запланировано",
      in_progress: "В работе",
      done: "Сделано"
    }
  },
  en: {
    brand: {
      name: "MindPulse",
      kicker: "MindPulse",
      title: "AI Energy OS"
    },
    common: {
      language: "Language",
      russian: "Русский",
      english: "English",
      select: "Select",
      choose: "Choose",
      fullName: "Full name",
      timezone: "Timezone",
      loading: "Loading...",
      saving: "Saving...",
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      email: "Email",
      password: "Password",
      timezonePlaceholder: "Timezone, for example Europe/Moscow",
      fullNamePlaceholder: "Full name",
      user: "User",
      appRhythm: "Personal work rhythm"
    },
    navigation: {
      features: "Features",
      howItWorks: "How it works",
      pricing: "Pricing",
      login: "Log in",
      startFree: "Start for free",
      openApp: "Go to workspace",
      pulse: "Daily Pulse",
      plan: "My Week",
      analytics: "Analytics",
      profile: "Profile",
      settings: "Settings",
      billing: "Plan & Billing",
      help: "Help",
      logout: "Log out",
      menu: "Menu",
      closeMenu: "Close menu",
      publicNav: "Public navigation",
      appNav: "Application navigation",
      userMenu: "Open user menu"
    },
    public: {
      heroKicker: "AI ENERGY OS FOR KNOWLEDGE WORKERS",
      heroTitle: "Plan your work around your energy, not just your deadlines.",
      heroDescription: "MindPulse helps you plan work around your daily capacity, cognitive load, and emotional load. It shows when your plan is realistic and when it is better to slow down.",
      heroPrimaryCta: "Start for free",
      heroSecondaryCta: "See how it works",
      trustLine: "Not another task list. A system for managing your work capacity.",
      compareKicker: "Why the product feels different",
      compareTitle: "Why MindPulse is different",
      compareDefaultTitle: "A typical task tracker",
      compareMindpulseTitle: "MindPulse",
      compareDefault1: "Tasks",
      compareDefault2: "Deadlines",
      compareDefault3: "Priorities",
      compareDefault4: "Calendar",
      compareMindpulse1: "Tasks",
      compareMindpulse2: "Available daily capacity",
      compareMindpulse3: "Cognitive load",
      compareMindpulse4: "Emotional load",
      compareMindpulse5: "Overload risk",
      compareMindpulse6: "Personal recommendations",
      benefitsKicker: "Outcomes",
      benefitsTitle: "Work sustainably, not at your limit",
      benefit1Title: "Realistic planning",
      benefit1Body: "Plan tasks within your actual daily capacity.",
      benefit2Title: "Overload protection",
      benefit2Body: "Spot overload before it affects your state.",
      benefit3Title: "Better timing for deep work",
      benefit3Body: "Schedule Deep Work when you actually have the capacity for it.",
      benefit4Title: "Personal patterns",
      benefit4Body: "Understand which tasks and work rhythms help you stay focused.",
      howKicker: "How it works",
      howTitle: "How it works",
      step1Title: "Check your state",
      step1Body: "Rate your energy, stress, and focus.",
      step2Title: "Build your plan",
      step2Body: "Distribute tasks across your week.",
      step3Title: "Compare workload with capacity",
      step3Body: "MindPulse shows how realistic your plan is.",
      step4Title: "Adjust the plan",
      step4Body: "Move or simplify tasks before overload happens.",
      pulseKicker: "Daily Pulse",
      pulseTitle: "Start the day by checking your available capacity",
      pulseBody: "Daily Pulse uses your energy, stress, and focus to estimate the capacity available for your plan.",
      weekKicker: "Weekly Plan",
      weekTitle: "See workload directly in your weekly plan",
      weekBody: "Each day shows its Pulse, planned workload, and remaining capacity. The values update automatically as tasks are added or moved.",
      analyticsKicker: "Analytics",
      analyticsTitle: "Understand your work patterns",
      analyticsBody: "Analytics connects your state, task types, and overload. Recommendations become more personal over time.",
      pricingTitle: "Pricing",
      pricingKicker: "Pricing",
      pricingSubtitle: "Start with a calm free workflow now, then move to deeper AI analysis when you want more personal guidance.",
      freePlanTitle: "Free",
      freePlan1: "Tasks and projects",
      freePlan2: "Daily Pulse",
      freePlan3: "Weekly Plan",
      freePlan4: "Basic analytics",
      freePlan5: "Rule-based recommendations",
      proPlanTitle: "Pro",
      proPlan1: "Advanced AI analytics",
      proPlan2: "Personal patterns",
      proPlan3: "AI Weekly Review",
      proPlan4: "Deep recommendations",
      proPlan5: "Full history",
      freeNow: "Available now",
      comingSoon: "Coming soon",
      faqKicker: "FAQ",
      faqTitle: "Frequently asked questions",
      faq1: "How is MindPulse different from a regular task tracker?",
      faq1Body: "MindPulse shows not only tasks, but also your available day capacity, work density, and overload risk.",
      faq2: "Do I need to fill in Daily Pulse every day?",
      faq2Body: "It helps, but it is not mandatory. The more regularly you check in, the more accurate your daily readiness and recommendations become.",
      faq3: "How is task load calculated?",
      faq3Body: "Load is derived from task type, cognitive load, and emotional load, then compared with the capacity available for the day.",
      faq4: "Can I use MindPulse for free?",
      faq4Body: "Yes. The free plan already includes tasks, Daily Pulse, Weekly Plan, and basic analytics.",
      faq5: "Are my data private?",
      faq5Body: "Yes. Every account works with its own isolated dataset through Supabase.",
      faq6: "Is English available?",
      faq6Body: "Yes. MindPulse supports both Russian and English.",
      footerProduct: "Product",
      footerAccount: "Account",
      footerDocs: "Documents",
      footerLanguage: "Language",
      privacy: "Privacy policy",
      terms: "Terms of use",
      copyright: "© 2026 MindPulse"
    },
    auth: {
      signInKicker: "Sign in",
      signInTitle: "Welcome back",
      signInBody: "Log in to open your personal tracker, projects, and check-ins.",
      signUpKicker: "Sign up",
      signUpTitle: "Open your personal workspace",
      signUpBody: "Your profile will be created automatically and you’ll land in the protected app right away.",
      forgotKicker: "Recovery",
      forgotTitle: "Reset password",
      forgotBody: "Enter your email and Supabase will send a recovery link.",
      repeatPassword: "Repeat password",
      createAccount: "Create account",
      forgotPassword: "Forgot password?",
      resetPassword: "Send email",
      alreadyHaveAccount: "Already have an account?",
      loginIdle: "Enter your email and password.",
      signupIdle: "Use the email you plan to keep using in MindPulse.",
      forgotIdle: "Ready to send the email.",
      checking: "Checking your credentials...",
      signingIn: "Signed in. Redirecting to the app...",
      creatingAccount: "Creating account...",
      accountCreated: "Account created. Redirecting to the app...",
      sendingReset: "Sending email...",
      resetSent: "Email sent. Check your inbox."
    },
    authErrors: {
      remoteUnavailable: "Could not reach the auth server. Check that the Supabase project is active and the site is opened by its public URL.",
      emailNotConfirmed: "This account email is not confirmed yet. Open the Supabase email and confirm it.",
      invalidCredentials: "Account not found or the password is incorrect.",
      sessionPersistence: "Sign-in succeeded, but the session was not persisted. This is usually caused by domain, Redirect URL, or environment variable settings.",
      userAlreadyRegistered: "This email is already registered. Try logging in instead.",
      signupEmailNotConfirmed: "The account was created, but the email is not confirmed yet. Confirm it from the Supabase email.",
      emailRateLimit: "Too many sign-up attempts in a row. Wait a few minutes or use a different email.",
      weakPassword: "The password is too short. Use a longer password.",
      sessionPersistenceSignup: "Sign-up succeeded, but the session was not persisted. This is usually caused by domain, Redirect URL, or environment variable settings."
    },
    pulse: {
      pageTitle: "Daily Pulse",
      pageSubtitle: "A daily check-in, your readiness for the day, and a sustainable work rhythm without unnecessary overload.",
      checkinKicker: "Daily Check-in",
      checkinTitle: "How are you today?",
      checkinCopy: "Check your state before planning your work.",
      energyTitle: "Energy",
      energyHint: "How much energy do you have today?",
      stressTitle: "Stress",
      stressHint: "How tense do you feel right now?",
      focusTitle: "Focus",
      focusHint: "How easy is it to concentrate?",
      sleep: "Sleep",
      mood: "Mood",
      sleepBad: "Poor",
      sleepNormal: "Okay",
      sleepGood: "Good",
      moodCalm: "Calm",
      moodNeutral: "Neutral",
      moodAnxious: "Anxious",
      moodIrritated: "Irritated",
      moodInspired: "Inspired",
      moodTired: "Tired",
      saveState: "Save state",
      idleStatus: "You can save today’s state.",
      emptyStatus: "Fill in today’s state so recommendations become more precise.",
      loadingStatus: "Loading Daily Pulse...",
      loadedStatus: "Today’s data has been loaded.",
      savingStatus: "Saving state...",
      savedStatus: "State saved.",
      loadError: "Could not open Daily Pulse.",
      migrationDailyCheckins: "The {table} table does not exist in Supabase yet. Run the SQL migrations from the supabase folder first.",
      migrationColumns: "The {table} table in Supabase needs a schema update for the Daily Pulse screen.",
      readinessKicker: "Readiness",
      readinessTitle: "Readiness Score",
      readinessCopy: "How suitable the day is for deep work based on your current state and workload.",
      energyDebt: "Energy Debt",
      energyDebtEmpty: "This metric will appear after a few days of usage.",
      bestForToday: "Best fit for today"
    },
    plan: {
      pageTitle: "Weekly Plan",
      pageSubtitle: "The whole week in one place: tasks by day, work density, and focus on what matters most.",
      boardKicker: "Weekly board",
      boardTitle: "Weekly Plan",
      week: "Week",
      day: "Day",
      focusKicker: "Day focus",
      focusTitle: "Today’s focus",
      add: "Add",
      addTaskPlaceholder: "Task",
      focusItemPlaceholder: "Item {index}",
      pulse: "Pulse",
      pulseNotAssessed: "Pulse not assessed",
      dayAssessed: "Day assessed",
      plan: "Plan",
      availableLoad: "Available load",
      plannedLoad: "Planned",
      overloadBy: "Over by",
      remaining: "Left",
      baseCapacity: "Base capacity",
      noteHeavy: "Better not add another heavy task.",
      noteLightOnly: "There is room only for a light task.",
      noteManageable: "The day still looks manageable.",
      noteDense: "The day is getting denser but still looks manageable.",
      noteOverloaded: "The day already looks overloaded. It is better to move some of the load.",
      totalTasks: "Total tasks",
      deepWork: "Deep Work",
      cognitiveHeavy: "Cognitively heavy",
      emotionalHeavy: "Emotionally heavy",
      pickWeek: "Choose week",
      pickDay: "Choose day",
      todayFocus: "Today’s focus",
      status: "Status",
      taskType: "Task type",
      cognitive: "Cognitive",
      emotional: "Emotional",
      overallLoad: "Overall load",
      saveTask: "Save",
      addTask: "Add",
      taskPlanned: "Planned",
      taskInProgress: "In progress",
      taskDone: "Done",
      editTask: "Edit",
      deleteTask: "Delete",
      pulseTooltipAssessed: "Day pulse\nAvailable load: {capacity}\nPlanned: {planned}\n{restLine}",
      pulseTooltipUnassessed: "Day pulse\nPulse not assessed\nPlanned: {planned}\nBase capacity: {capacity}",
      pulseOverByLine: "Over by: {value}",
      pulseRemainingLine: "Left: {value}",
      tasksForWeek: "For the selected week",
      deepWorkTasks: "Deep focus tasks",
      cognitiveHeavyTasks: "With load 4/5 or higher",
      emotionalHeavyTasks: "With load 4/5 or higher"
    },
    analytics: {
      pageTitle: "Analytics",
      pageSubtitle: "See the relationship between state, workload, and pace with a focus on clear conclusions instead of noise.",
      heroKicker: "Personal energy insights",
      heroTitle: "State, workload, and pace",
      heroBody: "This view shows how tasks influence your energy, stress, and focus. It helps you spot overload earlier and build a more sustainable weekly rhythm.",
      periodAnalysis: "Analysis period",
      periodSlice: "State and workload snapshot",
      period: "Period",
      weeklySummary: "Weekly summary",
      weeklyInsightsTitle: "Key insights this week",
      weeklyInsightsBody: "Meaningful takeaways first, charts and details below.",
      mainTakeaways: "Main takeaways",
      weeklyReviewKicker: "Weekly review",
      weeklyReviewTitle: "Weekly Review",
      weeklyReviewBody: "Generate a personal weekly review based on your state, workload, and tasks.",
      generateReview: "Generate weekly review",
      reviewPlaceholder: "Your weekly review will appear here after you click the button. It is built from your check-ins and tasks for the selected period.",
      loadStateTitle: "State by day",
      loadTaskTitle: "Workload by day",
      debtTitle: "Weekly Energy Debt",
      recommendationsTitle: "Recommendations",
      periodThisWeek: "This week",
      periodLastWeek: "Last week",
      periodLast14Days: "Last 14 days",
      periodLast30Days: "Last 30 days",
      loading: "Loading analytics...",
      refreshError: "Could not refresh analytics.",
      askAi: "Ask AI",
      aiKicker: "AI Assistant",
      aiTitle: "Ask AI",
      aiIntro: "You can ask what the analytics show and how to interpret state, workload, and focus.",
      aiPlaceholder: "Type your question...",
      aiStatus: "You can ask about state, energy, and tasks.",
      aiSend: "Send",
      noState: "There is no state data yet.",
      goToPulse: "Go to Daily Pulse",
      stateHint: "The metrics will appear after a few Daily Check-ins.",
      energyLegend: "Energy",
      stressLegend: "Stress",
      focusLegend: "Focus",
      stateInsightDown: "Energy dropped toward the end of the period. It helps to reduce the second half of the week and avoid stacking the hardest tasks there.",
      stateInsightStress: "Average stress is elevated. Alternating heavy days with calmer blocks usually works better.",
      stateInsightStable: "Your state looks relatively even. The more stable your check-ins are, the more precise workload recommendations become.",
      noTasks: "There are no tasks for the selected period yet.",
      goToPlan: "Go to My Week",
      loadHint: "Once tasks appear, this section will show which days are denser and where it is better to unload the schedule.",
      busiestDay: "The busiest day is {weekday}, {date}. Total workload — {load}.",
      noBusiestDay: "There are not enough tasks yet to identify the busiest day.",
      debtHint: "First you need several check-ins and tasks across a few consecutive days.",
      debtHigh: "Recent days are already building energy debt. It is better to reduce the density of the week and add recovery blocks.",
      debtWatch: "Load is starting to accumulate. It helps to watch heavy days and leave pauses after difficult tasks.",
      debtHealthy: "The rhythm still looks stable: there is no strong accumulation of energy debt yet.",
      insightLoadStress: "Stress was higher on the days with high total workload.",
      insightLowEnergyHeavy: "On low-energy days there were still many tasks with high cognitive load. This increases overload risk.",
      insightFocusModerate: "The best focus tended to appear on moderate-load days rather than overloaded ones.",
      insightEmotionType: "Tasks of type “{type}” created the main emotional load in this period.",
      insightFewData: "There is not enough data for confident conclusions yet. Keep filling in your state and managing tasks for several days in a row.",
      insightEmpty: "Analytics will appear after a few days of using the tracker.",
      typeAvgCognitive: "Average cognitive: {value}",
      typeAvgEmotional: "Average emotional: {value}",
      typeAvgLoad: "Average load: {value}",
      typeDominant: "{type} makes up {percent}% of tasks in this period and forms the main part of the workload.",
      overloadCurrent: "Current status",
      overloadDays: "{riskDays} overload-risk days • {highDays} high-load days",
      recommendationStable: "The rhythm looks stable right now. Try to keep a moderate amount of hard work and do not forget recovery.",
      weeklyReviewEmpty: "There is not enough data for a weekly review yet. Add tasks and fill in your state at least a few times first.",
      weeklyReviewPrompt: "Click “Generate weekly review” and a personal text report about your state, workload, and tasks will appear here.",
      weeklyReviewLoading: "Generating Weekly Review...",
      weeklyReviewPro: "Pro AI",
      weeklyReviewCache: "Cached AI Review",
      weeklyReviewNoData: "There is not enough data to generate a weekly review yet: first you need a few check-ins and tasks for the selected period.",
      weeklyReviewStateSummary: "During this period, average energy was {energy}, stress was {stress}, and focus was {focus}.",
      weeklyReviewStateFew: "There are still few check-ins in this period, so the review is based mainly on task structure and workload.",
      weeklyReviewCompleted: "What worked: {count} {tasksWord} were completed. This is a good sign that the plan at least partly matched the real weekly capacity.",
      weeklyReviewCompletedFew: "What worked: there are still only a few completed tasks, so it is worth paying closer attention to plan size and daily priorities.",
      weeklyReviewHeavyDays: "What overloaded you: the heaviest days were {days}. On those days total workload went beyond the comfortable range.",
      weeklyReviewHeavyDaysNone: "What overloaded you: there are almost no obvious overload days, and the weekly rhythm looks fairly even.",
      weeklyReviewTopTasks: "The tasks that took the most energy were: {tasks}.",
      weeklyReviewDebt: "Energy Debt at the end of the period is {value}. This means: {label}.",
      weeklyReviewNext: "Next week it will help to leave fewer heavy tasks on the densest days and add recovery blocks after deep work or emotionally difficult communication.",
      energyAverage: "Average energy",
      stressAverage: "Average stress",
      focusAverage: "Average focus",
      checkinAppears: "Appears after Daily Check-in",
      checkinAppearsLater: "Will appear after several state check-ins",
      overloadRisk: "Overload risk",
      overloadRiskLow: "Low",
      overloadRiskLowNote: "The rhythm still looks stable.",
      overloadRiskMedium: "Medium",
      overloadRiskMediumNote: "The workload needs attention.",
      overloadRiskHigh: "High",
      overloadRiskHighNote: "The week looks overloaded.",
      weekSummaryLabel: "Observation",
      weekSummaryFallbackTitle: "Insights will appear after a few days of data",
      weekSummaryFallbackBody: "Once there are check-ins and tasks across several days, repeated patterns will start to show up here.",
      weekSummaryLoadLabel: "Workload",
      weekSummaryEmotionLabel: "Emotion",
      weekSummaryFocusLabel: "Focus",
      weekSummaryRecoveryLabel: "Recovery"
    },
    profile: {
      pageTitle: "Profile",
      pageSubtitle: "Account details, name, language, and timezone for a more personal work rhythm.",
      kicker: "User profile",
      title: "Your details",
      save: "Save profile",
      loading: "Loading profile...",
      ready: "You can update your profile.",
      saved: "Profile saved.",
      localeLabel: "Interface language",
      loadError: "Could not load profile.",
      saveProgress: "Saving profile...",
      saveError: "Could not save profile."
    },
    settings: {
      pageTitle: "Settings",
      pageSubtitle: "Core system settings will live here as MindPulse grows.",
      title: "Language & region",
      body: "For now, the key system setting is your interface language. Later this screen can include region, time format, and other product behavior preferences.",
      field: "Interface language",
      hint: "Choose the main language of the app.",
      save: "Save settings",
      saved: "Settings saved.",
      loading: "Loading settings...",
      ready: "You can update the interface language.",
      saveProgress: "Saving settings...",
      saveError: "Could not save settings."
    },
    pricing: {
      pageTitle: "Pricing",
      heroKicker: "Monetization ready",
      heroTitle: "Freemium model for AI Energy OS",
      heroBody: "Free delivers value without external AI: tasks, Daily Pulse, Daily Check-in, Readiness Score, Energy Debt, basic analytics, rule-based recommendations, and a basic Weekly Review. Pro adds deeper AI analysis, AI Weekly Review, personal patterns, advanced recommendations, and full analytics history.",
      currentPlan: "Current plan: Free",
      heroSide: "Payments are not enabled yet. This page prepares the product for monetization and shows the line between Free and Pro.",
      freeTitle: "For a sustainable daily rhythm without unnecessary complexity",
      proTitle: "For deeper AI insight and long-term growth",
      availableNow: "Available now",
      comingSoon: "Coming soon",
      startFree: "Start for free",
      paymentSoon: "Payments coming soon",
      compareTitle: "What each plan includes",
      compareKicker: "Comparison",
      feature: "Feature",
      yes: "Yes",
      no: "—",
      currentGuestPlan: "Starter plan: Free",
      free: "Free",
      pro: "Pro"
    },
    pricingFeature: {
      taskPlanning: "Task planning",
      dailyPulse: "Daily Pulse",
      dailyCheckin: "Daily Check-in",
      readinessScore: "Readiness Score",
      energyDebt: "Energy Debt",
      ruleBasedCoach: "Rule-based Coach",
      basicWeeklyReview: "Basic Weekly Review",
      basicAnalytics: "Basic analytics",
      deepAiCoach: "Deep AI Coach",
      aiWeeklyReview: "AI Weekly Review",
      personalPatterns: "Personal patterns",
      overloadPrediction: "Overload prediction",
      advancedRecommendations: "Advanced recommendations",
      aiRequests: "100 AI requests / month",
      fullHistory: "Full history"
    },
    validation: {
      requiredEmail: "Enter your email.",
      requiredPassword: "Enter your password.",
      passwordMismatch: "Passwords do not match.",
      signInFailed: "Could not sign in.",
      signUpFailed: "Could not create your account.",
      saveFailed: "Could not save changes",
      invalidEmail: "Enter a valid email address",
      networkFailed: "Could not reach the server."
    },
    taskTypes: {
      deep_work: "Deep Work",
      communication: "Communication",
      creative: "Creative",
      routine: "Routine",
      learning: "Learning",
      recovery: "Recovery"
    },
    taskTypeDescriptions: {
      deep_work: "Deep work and concentration",
      communication: "Meetings, calls, negotiations",
      creative: "Ideas, writing, creating something new",
      routine: "Administrative and repetitive work",
      learning: "Reading, research, learning new things",
      recovery: "Rest, walking, sport, pause"
    },
    workload: {
      untitledTask: "Untitled task",
      intensityLow: "Low",
      intensityMedium: "Medium",
      intensityHigh: "High",
      intensityVeryHigh: "Very high",
      loadBalanced: "Balanced",
      loadComfort: "Comfortable load",
      loadDense: "Dense day",
      loadOverload: "Overload risk",
      recoveryNote: "After this task, a break of about {minutes} minutes may be helpful.",
      readinessHigh: "High readiness",
      readinessStable: "Stable state",
      readinessHeavy: "Heavy day",
      readinessRisk: "Better reduce the load",
      modeDeepWork: "Deep Work",
      modeAdmin: "Admin",
      modeLightTasks: "Light Tasks",
      modeRecovery: "Recovery",
      readinessInfluences: "The biggest factors affecting your day right now are: {items}.",
      readinessFallback: "So far, the day plan still looks realistic.",
      recNoCheckin: "Fill in your daily state so recommendations become more accurate.",
      recLowEnergyStress: "Today it’s better to reduce the load and keep only the most important tasks.",
      recTooMuchDeepWork: "The day is getting denser. It’s better to keep Deep Work to 1–2 tasks.",
      recHeavyCommunication: "There is already a lot of emotionally heavy communication today. It helps to leave switching time between these tasks.",
      recEnergyDebt: "You have been working in energy debt lately. Add Recovery or Light Tasks.",
      recTooManyOpenTasks: "The plan looks overloaded. Try reducing the list of tasks for today or moving part of the work.",
      recLowEnergy: "With the current energy level, it’s better to start with Routine or Recovery and reduce Deep Work.",
      recHighStress: "Today it’s worth reducing emotionally demanding communication.",
      recBalanced: "The day still looks stable. Keep 1–2 main tasks in focus and avoid overloading the second half of the day.",
      dayCapacityFilled: "The day’s capacity is already filled.",
      dayComfortable: "The plan still feels manageable.",
      dayHasCapacity: "There is still room for another light task.",
      heavyTasksCount: "Heavy tasks",
      baseCapacityShort: "usual {value}",
      debtHealthy: "Healthy rhythm",
      debtHealthyNote: "Your weekly rhythm still looks stable.",
      debtWatch: "Worth watching",
      debtWatchNote: "Load is starting to accumulate, so it helps to watch recovery more carefully.",
      debtFatigue: "Accumulated fatigue",
      debtFatigueNote: "The last few days already look fairly dense.",
      debtOverloaded: "Better reduce the load",
      debtOverloadedNote: "You have been working in energy debt lately. It’s better to reduce the load or add recovery."
    },
    taskStatus: {
      planned: "Planned",
      in_progress: "In progress",
      done: "Done"
    }
  }
};

let currentLocale = null;

function getByPath(object, path) {
  return String(path || "")
    .split(".")
    .filter(Boolean)
    .reduce((acc, key) => (acc && key in acc ? acc[key] : undefined), object);
}

function interpolate(template, values = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}

function writeCookie(name, value, maxAgeDays = 365) {
  const maxAge = maxAgeDays * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function detectInitialLocale() {
  const saved = window.appStorage?.getItem(LOCALE_STORAGE_KEY) || readCookie(LOCALE_COOKIE_KEY);
  if (supportedLocales.includes(saved)) {
    return saved;
  }

  const browserLocale = String(window.navigator?.language || "").toLowerCase();
  if (browserLocale.startsWith("ru")) {
    return "ru";
  }

  return "en";
}

export function getLocale() {
  if (!currentLocale) {
    currentLocale = detectInitialLocale();
  }
  return currentLocale;
}

export function t(key, values = {}, locale = getLocale()) {
  const template = getByPath(messages[locale], key) ?? getByPath(messages[defaultLocale], key) ?? key;
  return interpolate(template, values);
}

export function setLocale(locale, { silent = false } = {}) {
  const nextLocale = supportedLocales.includes(locale) ? locale : defaultLocale;
  currentLocale = nextLocale;
  window.appStorage?.setItem(LOCALE_STORAGE_KEY, nextLocale);
  writeCookie(LOCALE_COOKIE_KEY, nextLocale);
  document.documentElement.lang = nextLocale;
  if (!silent) {
    applyTranslations(document);
    window.dispatchEvent(new CustomEvent("mindpulse:localechange", { detail: { locale: nextLocale } }));
    listeners.forEach((listener) => listener(nextLocale));
  }
  return nextLocale;
}

export function onLocaleChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function initI18n() {
  const locale = getLocale();
  document.documentElement.lang = locale;
  applyTranslations(document);
  return locale;
}

export function applyTranslations(root = document) {
  const locale = getLocale();

  root.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n, parseDatasetValues(node.dataset), locale);
  });

  root.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder, parseDatasetValues(node.dataset), locale));
  });

  root.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel, parseDatasetValues(node.dataset), locale));
  });

  root.querySelectorAll("[data-i18n-title]").forEach((node) => {
    node.setAttribute("title", t(node.dataset.i18nTitle, parseDatasetValues(node.dataset), locale));
  });

  root.querySelectorAll("[data-i18n-html]").forEach((node) => {
    node.innerHTML = t(node.dataset.i18nHtml, parseDatasetValues(node.dataset), locale);
  });

  const body = document.body;
  if (body?.dataset?.publicActive === "home") {
    document.title = `${locale === "ru" ? t("brand.name", {}, locale) : t("brand.kicker", {}, locale)} — ${locale === "ru" ? "ИИ-платформа энергии для knowledge workers" : "AI Energy OS for knowledge workers"}`;
  } else if (body?.dataset?.publicActive === "login") {
    document.title = `${locale === "ru" ? "Войти" : "Log in"} — ${locale === "ru" ? t("brand.name", {}, locale) : "MindPulse"}`;
  } else if (body?.dataset?.publicActive === "signup") {
    document.title = `${locale === "ru" ? "Регистрация" : "Sign up"} — ${locale === "ru" ? t("brand.name", {}, locale) : "MindPulse"}`;
  } else if (body?.dataset?.appActive === "pulse") {
    document.title = `${t("pulse.pageTitle", {}, locale)} — ${locale === "ru" ? t("brand.name", {}, locale) : "MindPulse"}`;
    body.dataset.appTitle = t("pulse.pageTitle", {}, locale);
    body.dataset.appSubtitle = t("pulse.pageSubtitle", {}, locale);
  } else if (body?.dataset?.appActive === "plan") {
    document.title = `${t("plan.pageTitle", {}, locale)} — ${locale === "ru" ? t("brand.name", {}, locale) : "MindPulse"}`;
    body.dataset.appTitle = t("plan.pageTitle", {}, locale);
    body.dataset.appSubtitle = t("plan.pageSubtitle", {}, locale);
  } else if (body?.dataset?.appActive === "analytics") {
    document.title = `${t("analytics.pageTitle", {}, locale)} — ${locale === "ru" ? t("brand.name", {}, locale) : "MindPulse"}`;
    body.dataset.appTitle = t("analytics.pageTitle", {}, locale);
    body.dataset.appSubtitle = t("analytics.pageSubtitle", {}, locale);
  } else if (body?.dataset?.appActive === "profile") {
    document.title = `${t("profile.pageTitle", {}, locale)} — ${locale === "ru" ? t("brand.name", {}, locale) : "MindPulse"}`;
    body.dataset.appTitle = t("profile.pageTitle", {}, locale);
    body.dataset.appSubtitle = t("profile.pageSubtitle", {}, locale);
  } else if (body?.dataset?.appActive === "settings") {
    document.title = `${t("settings.pageTitle", {}, locale)} — ${locale === "ru" ? t("brand.name", {}, locale) : "MindPulse"}`;
    body.dataset.appTitle = t("settings.pageTitle", {}, locale);
    body.dataset.appSubtitle = t("settings.pageSubtitle", {}, locale);
  }
}

function parseDatasetValues(dataset = {}) {
  return Object.fromEntries(
    Object.entries(dataset)
      .filter(([key]) => key.startsWith("i18nVar"))
      .map(([key, value]) => [key.replace(/^i18nVar/, "").replace(/^[A-Z]/, (letter) => letter.toLowerCase()), value])
  );
}

export function formatDate(date, options = {}) {
  return new Intl.DateTimeFormat(getLocale() === "ru" ? "ru-RU" : "en-US", options).format(date);
}

export function formatNumber(value, options = {}) {
  return new Intl.NumberFormat(getLocale() === "ru" ? "ru-RU" : "en-US", options).format(value);
}

export function getLocaleMessageTree() {
  return messages[getLocale()];
}

export function getMessages() {
  return messages;
}
