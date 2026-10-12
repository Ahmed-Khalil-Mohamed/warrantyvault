import type { Copy } from "./contracts";
export const errors: Record<string, Copy> = {
  unauthorized: {
    en: "Sign in to open your workspace.",
    ar: "سجّل الدخول لفتح مساحة العمل.",
  },
  invalid_input: {
    en: "Check the required fields, dates, and number limits.",
    ar: "راجع الحقول المطلوبة والتواريخ وحدود الأرقام.",
  },
  invalid_money: {
    en: "Enter a positive amount with no more than two decimal places.",
    ar: "اكتب مبلغًا موجبًا بحد أقصى رقمين بعد العلامة العشرية.",
  },
  invalid_login: {
    en: "Email or password is incorrect.",
    ar: "البريد أو كلمة المرور غير صحيحة.",
  },
  email_exists: {
    en: "This email already has an account. Sign in instead.",
    ar: "البريد ده له حساب بالفعل. سجّل الدخول.",
  },
  conflict: {
    en: "This record changed. Refresh and try again.",
    ar: "البيانات اتغيرت. حدّث الصفحة وحاول تاني.",
  },
  insufficient_capacity: {
    en: "There are not enough available places or portions.",
    ar: "العدد المطلوب أكبر من الأماكن أو الحصص المتاحة.",
  },
  insufficient_stock: {
    en: "You cannot issue more than the available stock.",
    ar: "لا يمكن صرف كمية أكبر من المخزون المتاح.",
  },
  invalid_transition: {
    en: "This action is not available in the current state.",
    ar: "الإجراء غير متاح في الحالة الحالية.",
  },
  expired: { en: "The deadline has passed.", ar: "الموعد انتهى." },
  future_deadline: {
    en: "Choose a deadline in the future.",
    ar: "اختار موعدًا في المستقبل.",
  },
  invalid_dates: {
    en: "The end date must be on or after the purchase date.",
    ar: "تاريخ الانتهاء لازم يكون بعد الشراء أو في نفس اليوم.",
  },
  future_purchase: {
    en: "The purchase date cannot be in the future.",
    ar: "تاريخ الشراء لا يمكن أن يكون في المستقبل.",
  },
  duplicate: {
    en: "This product code or volunteer already exists.",
    ar: "كود المنتج أو اسم المتطوع موجود بالفعل.",
  },
  project_incomplete: {
    en: "Complete all deliverables and record the full payment first.",
    ar: "أكمل كل التسليمات وسجّل كامل الدفعات أولًا.",
  },
  overpayment: {
    en: "The payment exceeds the outstanding balance.",
    ar: "الدفعة أكبر من المبلغ المتبقي.",
  },
  shift_started: {
    en: "This shift has already started.",
    ar: "الوردية بدأت بالفعل.",
  },
  shift_not_started: {
    en: "Attendance opens when the shift starts.",
    ar: "تسجيل الحضور يبدأ مع بداية الوردية.",
  },
  shift_not_finished: {
    en: "Wait until the scheduled end before completing this shift.",
    ar: "انتظر نهاية الوقت المحدد قبل إنهاء الوردية.",
  },
  invalid_split: {
    en: "Add 1–30 unique participants, separated by commas.",
    ar: "أضف من ١ إلى ٣٠ اسمًا مختلفًا مفصولين بفاصلة.",
  },
  not_due: {
    en: "This card is not due yet.",
    ar: "موعد مراجعة البطاقة لم يأتِ بعد.",
  },
  queue_empty: {
    en: "There are no visitors waiting.",
    ar: "لا يوجد زوار في الانتظار.",
  },
  not_empty: {
    en: "Sample data can only be added to an empty workspace.",
    ar: "يمكن إضافة البيانات التجريبية لمساحة فارغة فقط.",
  },
  rate_limit: {
    en: "Too many attempts. Please try again in ten minutes.",
    ar: "محاولات كثيرة. حاول بعد عشر دقائق.",
  },
  not_found: {
    en: "This record no longer exists.",
    ar: "السجل لم يعد موجودًا.",
  },
  too_many: {
    en: "The workspace or input limit has been reached.",
    ar: "تم الوصول للحد الأقصى للبيانات.",
  },
  server_error: {
    en: "Something went wrong on the server. Try again.",
    ar: "حدث خطأ في الخادم. حاول مرة أخرى.",
  },
  network_error: {
    en: "Connection lost. Your saved data is safe; reconnect and retry.",
    ar: "الاتصال انقطع. بياناتك المحفوظة موجودة؛ أعد الاتصال وحاول تاني.",
  },
  record_limit: {
    en: "This record has reached its history limit.",
    ar: "السجل وصل للحد الأقصى لتاريخه.",
  },
  request_origin: {
    en: "The request could not be verified. Reload the app.",
    ar: "تعذر التحقق من الطلب. أعد تحميل التطبيق.",
  },
};
