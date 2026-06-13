// AUTO-GENERATED from yuton_backend controllers. 42 modules, 304 endpoints.
// Do not edit by hand — regenerate from the backend route manifest.
export interface ApiEndpoint {
  verb: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  summary: string;
  perm: string;
  hasBody: boolean;
  hasQuery: boolean;
  pathParams: string[];
  body: Record<string, unknown> | null;
  query: Record<string, unknown> | null;
}
export interface ApiModule {
  module: string;
  label: string;
  icon: string;
  tag: string;
  base: string;
  versionNeutral: boolean;
  endpoints: ApiEndpoint[];
}
export const API_MODULES: ApiModule[] = [
  {
    "module": "academic",
    "label": "Taʼlim",
    "icon": "GraduationCap",
    "tag": "Taʼlim",
    "base": "academic",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "years",
        "summary": "O‘quv yillar ro‘yxatini olish",
        "perm": "ACADEMIC_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "years",
        "summary": "O‘quv yili yaratish",
        "perm": "ACADEMIC_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "startDate": "",
          "endDate": "",
          "isCurrent": false
        },
        "query": null
      },
      {
        "verb": "GET",
        "path": "years/:id",
        "summary": "O‘quv yilini ID bo‘yicha olish",
        "perm": "ACADEMIC_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "years/:id",
        "summary": "O‘quv yilini tahrirlash",
        "perm": "ACADEMIC_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "DELETE",
        "path": "years/:id",
        "summary": "O‘quv yilini arxivlash",
        "perm": "ACADEMIC_MANAGE",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "GET",
        "path": "quarters",
        "summary": "Choraklar ro‘yxatini olish",
        "perm": "ACADEMIC_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": {
          "academicYearId": ""
        }
      },
      {
        "verb": "POST",
        "path": "quarters",
        "summary": "Chorak yaratish",
        "perm": "ACADEMIC_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "academicYearId": "",
          "quarterNumber": 0,
          "startDate": "",
          "endDate": "",
          "status": ""
        },
        "query": null
      },
      {
        "verb": "GET",
        "path": "quarters/:id",
        "summary": "Chorakni ID bo‘yicha olish",
        "perm": "ACADEMIC_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "quarters/:id",
        "summary": "Chorakni tahrirlash",
        "perm": "ACADEMIC_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "DELETE",
        "path": "quarters/:id",
        "summary": "Chorakni arxivlash",
        "perm": "ACADEMIC_MANAGE",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "GET",
        "path": "lesson-periods",
        "summary": "Dars vaqtlarini olish",
        "perm": "ACADEMIC_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "lesson-periods",
        "summary": "Dars vaqti yaratish",
        "perm": "ACADEMIC_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "lessonNumber": 0,
          "startTime": "",
          "endTime": ""
        },
        "query": null
      },
      {
        "verb": "GET",
        "path": "lesson-periods/:id",
        "summary": "Dars vaqtini ID bo‘yicha olish",
        "perm": "ACADEMIC_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "lesson-periods/:id",
        "summary": "Dars vaqtini tahrirlash",
        "perm": "ACADEMIC_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "DELETE",
        "path": "lesson-periods/:id",
        "summary": "Dars vaqtini arxivlash",
        "perm": "ACADEMIC_MANAGE",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "GET",
        "path": "subjects",
        "summary": "Fanlar ro‘yxatini olish",
        "perm": "ACADEMIC_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": {
          "search": "",
          "status": ""
        }
      },
      {
        "verb": "POST",
        "path": "subjects",
        "summary": "Fan yaratish",
        "perm": "ACADEMIC_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "russianName": "",
          "color": "",
          "englishName": "",
          "code": ""
        },
        "query": null
      },
      {
        "verb": "GET",
        "path": "subjects/:id",
        "summary": "Fanni ID bo‘yicha olish",
        "perm": "ACADEMIC_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "subjects/:id",
        "summary": "Fanni tahrirlash",
        "perm": "ACADEMIC_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {
          "status": "",
          "isActive": false
        },
        "query": null
      },
      {
        "verb": "DELETE",
        "path": "subjects/:id",
        "summary": "Fanni arxivlash",
        "perm": "ACADEMIC_MANAGE",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "GET",
        "path": "courses",
        "summary": "Kurslar ro‘yxatini olish",
        "perm": "ACADEMIC_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": {
          "search": "",
          "quarterId": "",
          "quarterNumber": "",
          "startDate": "",
          "endDate": "",
          "subjectId": "",
          "teacherId": "",
          "status": "",
          "page": 1,
          "limit": 20
        }
      },
      {
        "verb": "POST",
        "path": "courses",
        "summary": "Kurs yaratish",
        "perm": "ACADEMIC_MANAGE",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "GET",
        "path": "courses/:id/available-students",
        "summary": "Kursga qo‘shish mumkin bo‘lgan o‘quvchilarni qidirish",
        "perm": "ACADEMIC_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": {
          "classId": "",
          "search": ""
        }
      },
      {
        "verb": "POST",
        "path": "courses/:id/students",
        "summary": "Kursga o‘quvchilar qo‘shish",
        "perm": "ACADEMIC_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {
          "studentIds": []
        },
        "query": null
      },
      {
        "verb": "DELETE",
        "path": "courses/:id/students/:studentId",
        "summary": "Kursdan bitta o‘quvchini olib tashlash",
        "perm": "ACADEMIC_MANAGE",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id",
          "studentId"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "GET",
        "path": "courses/:id",
        "summary": "Kurs haqida maʼlumot olish",
        "perm": "ACADEMIC_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "courses/:id",
        "summary": "Kursni tahrirlash",
        "perm": "ACADEMIC_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {
          "status": ""
        },
        "query": null
      },
      {
        "verb": "DELETE",
        "path": "courses/:id",
        "summary": "Kursni arxivlash",
        "perm": "ACADEMIC_MANAGE",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "GET",
        "path": "classes",
        "summary": "Sinflar ro‘yxatini olish",
        "perm": "ACADEMIC_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": {
          "academicYearId": "",
          "gradeLevel": "",
          "language": "",
          "roomId": "",
          "curatorId": "",
          "search": ""
        }
      },
      {
        "verb": "POST",
        "path": "classes",
        "summary": "Sinf yaratish",
        "perm": "ACADEMIC_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "gradeLevel": 0,
          "section": "",
          "language": "",
          "roomId": "",
          "curatorId": "",
          "academicYearId": "",
          "capacity": 0,
          "classType": "",
          "shift": ""
        },
        "query": null
      },
      {
        "verb": "GET",
        "path": "classes/:id",
        "summary": "Sinfni ko‘rish",
        "perm": "ACADEMIC_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "classes/:id",
        "summary": "Sinfni tahrirlash",
        "perm": "ACADEMIC_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "DELETE",
        "path": "classes/:id",
        "summary": "Sinfni arxivlash",
        "perm": "ACADEMIC_MANAGE",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "classes/:id/transfer-students",
        "summary": "O‘quvchilarni boshqa sinfga ko‘chirish",
        "perm": "ACADEMIC_MANAGE",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      }
    ]
  },
  {
    "module": "access-control",
    "label": "Kirish nazorati",
    "icon": "ShieldCheck",
    "tag": "Access Control",
    "base": "access-control",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "devices",
        "summary": "",
        "perm": "ACCESS_CONTROL_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "devices",
        "summary": "",
        "perm": "ACCESS_CONTROL_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "serialNumber": "",
          "location": "",
          "ipAddress": "",
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "devices/:id",
        "summary": "",
        "perm": "ACCESS_CONTROL_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "face-profiles",
        "summary": "",
        "perm": "ACCESS_CONTROL_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "face-profiles",
        "summary": "",
        "perm": "ACCESS_CONTROL_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "personType": "",
          "personId": "",
          "photoUrl": "",
          "faceTemplateHash": "",
          "active": false
        },
        "query": null
      },
      {
        "verb": "GET",
        "path": "events",
        "summary": "",
        "perm": "ACCESS_CONTROL_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "events",
        "summary": "",
        "perm": "ACCESS_CONTROL_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "deviceId": "",
          "personType": "",
          "personId": "",
          "direction": "",
          "decision": "",
          "eventTime": "",
          "snapshotUrl": "",
          "reason": ""
        },
        "query": null
      }
    ]
  },
  {
    "module": "admissions",
    "label": "Qabul",
    "icon": "ClipboardList",
    "tag": "Admissions",
    "base": "admissions",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "pipelines",
        "summary": "",
        "perm": "ADMISSIONS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "pipelines",
        "summary": "",
        "perm": "ADMISSIONS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "code": "",
          "isActive": false
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "pipelines/:id",
        "summary": "",
        "perm": "ADMISSIONS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "stages",
        "summary": "",
        "perm": "ADMISSIONS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "stages",
        "summary": "",
        "perm": "ADMISSIONS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "pipelineId": "",
          "code": "",
          "orderIndex": 0,
          "isFinal": false
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "stages/:id",
        "summary": "",
        "perm": "ADMISSIONS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "applications",
        "summary": "",
        "perm": "ADMISSIONS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "applications",
        "summary": "",
        "perm": "ADMISSIONS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "applicationNo": "",
          "studentFirstName": "",
          "studentLastName": "",
          "birthDate": "",
          "parentFullName": "",
          "parentPhone": "",
          "gradeLevel": "",
          "source": "",
          "stageId": "",
          "status": "",
          "notes": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "applications/:id",
        "summary": "",
        "perm": "ADMISSIONS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "exams",
        "summary": "",
        "perm": "ADMISSIONS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "exams",
        "summary": "",
        "perm": "ADMISSIONS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "applicationId": "",
          "subject": "",
          "examDate": "",
          "score": 0,
          "maxScore": 0,
          "result": "",
          "comment": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "exams/:id",
        "summary": "",
        "perm": "ADMISSIONS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "decisions",
        "summary": "",
        "perm": "ADMISSIONS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "decisions",
        "summary": "",
        "perm": "ADMISSIONS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "applicationId": "",
          "decision": "",
          "decidedById": "",
          "decidedAt": "",
          "comment": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "decisions/:id",
        "summary": "",
        "perm": "ADMISSIONS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      }
    ]
  },
  {
    "module": "advanced-finance",
    "label": "Moliya (kengaytirilgan)",
    "icon": "Banknote",
    "tag": "Advanced Finance",
    "base": "advanced-finance",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "invoices",
        "summary": "",
        "perm": "ADVANCED_FINANCE_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "invoices",
        "summary": "",
        "perm": "ADVANCED_FINANCE_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "invoiceNo": "",
          "studentId": "",
          "contractId": "",
          "issueDate": "",
          "dueDate": "",
          "amount": 0,
          "paidAmount": 0,
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "invoices/:id",
        "summary": "",
        "perm": "ADVANCED_FINANCE_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "scholarships",
        "summary": "",
        "perm": "ADVANCED_FINANCE_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "scholarships",
        "summary": "",
        "perm": "ADVANCED_FINANCE_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "studentId": "",
          "discountPercent": 0,
          "fixedAmount": 0,
          "startDate": "",
          "endDate": "",
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "scholarships/:id",
        "summary": "",
        "perm": "ADVANCED_FINANCE_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "refunds",
        "summary": "",
        "perm": "ADVANCED_FINANCE_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "refunds",
        "summary": "",
        "perm": "ADVANCED_FINANCE_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "paymentId": "",
          "studentId": "",
          "amount": 0,
          "reason": "",
          "status": "",
          "processedAt": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "refunds/:id",
        "summary": "",
        "perm": "ADVANCED_FINANCE_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "cashboxes",
        "summary": "",
        "perm": "ADVANCED_FINANCE_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "cashboxes",
        "summary": "",
        "perm": "ADVANCED_FINANCE_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "code": "",
          "currency": "",
          "balance": 0,
          "isActive": false
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "cashboxes/:id",
        "summary": "",
        "perm": "ADVANCED_FINANCE_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "bank-transactions",
        "summary": "",
        "perm": "ADVANCED_FINANCE_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "bank-transactions",
        "summary": "",
        "perm": "ADVANCED_FINANCE_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "transactionNo": "",
          "bankName": "",
          "transactionDate": "",
          "amount": 0,
          "direction": "",
          "matchedPaymentId": "",
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "bank-transactions/:id",
        "summary": "",
        "perm": "ADVANCED_FINANCE_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      }
    ]
  },
  {
    "module": "analytics",
    "label": "Analitika",
    "icon": "ChartLine",
    "tag": "Analytics",
    "base": "analytics",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "dashboard",
        "summary": "",
        "perm": "ANALYTICS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      }
    ]
  },
  {
    "module": "appeals",
    "label": "Shikoyatlar",
    "icon": "MessageSquareWarning",
    "tag": "Takliflar va shikoyatlar",
    "base": "appeals",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "",
        "summary": "Murojaatlar ro‘yxatini olish",
        "perm": "APPEALS_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": {
          "search": "",
          "status": "",
          "targetRole": "",
          "source": "",
          "period": "",
          "page": 1,
          "limit": 20
        }
      },
      {
        "verb": "POST",
        "path": "",
        "summary": "Murojaat yaratish",
        "perm": "APPEALS_MANAGE",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "GET",
        "path": ":id",
        "summary": "Murojaatni ID bo‘yicha olish",
        "perm": "APPEALS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "PATCH",
        "path": ":id",
        "summary": "Murojaatni qisman tahrirlash",
        "perm": "APPEALS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "DELETE",
        "path": ":id",
        "summary": "Murojaatni arxivlash",
        "perm": "APPEALS_MANAGE",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      }
    ]
  },
  {
    "module": "assets",
    "label": "Aktivlar",
    "icon": "Boxes",
    "tag": "Assets",
    "base": "assets",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "items",
        "summary": "",
        "perm": "ASSETS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "items",
        "summary": "",
        "perm": "ASSETS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "assetCode": "",
          "category": "",
          "purchaseDate": "",
          "purchaseCost": 0,
          "currentValue": 0,
          "location": "",
          "responsibleStaffId": "",
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "items/:id",
        "summary": "",
        "perm": "ASSETS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "maintenance",
        "summary": "",
        "perm": "ASSETS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "maintenance",
        "summary": "",
        "perm": "ASSETS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "assetId": "",
          "priority": "",
          "status": "",
          "assignedToId": "",
          "dueDate": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "maintenance/:id",
        "summary": "",
        "perm": "ASSETS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "depreciations",
        "summary": "",
        "perm": "ASSETS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "depreciations",
        "summary": "",
        "perm": "ASSETS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "assetId": "",
          "period": "",
          "amount": 0,
          "bookValue": 0,
          "notes": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "depreciations/:id",
        "summary": "",
        "perm": "ASSETS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      }
    ]
  },
  {
    "module": "attendance",
    "label": "Davomat",
    "icon": "CalendarCheck",
    "tag": "Davomat",
    "base": "attendance",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "students",
        "summary": "O‘quvchi davomat yozuvlarini sana bo‘yicha olish",
        "perm": "ATTENDANCE_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": {
          "date": ""
        }
      },
      {
        "verb": "POST",
        "path": "students",
        "summary": "O‘quvchi davomat yozuvini yaratish yoki tahrirlash",
        "perm": "ATTENDANCE_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "studentId": "",
          "date": "",
          "status": "",
          "checkInTime": "",
          "checkOutTime": "",
          "reason": ""
        },
        "query": null
      }
    ]
  },
  {
    "module": "auth",
    "label": "Autentifikatsiya",
    "icon": "KeyRound",
    "tag": "Autentifikatsiya",
    "base": "auth",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "POST",
        "path": "register",
        "summary": "Yangi foydalanuvchini ro‘yxatdan o‘tkazish va JWT token berish",
        "perm": "",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "username": "",
          "password": "",
          "email": "",
          "phone": "",
          "firstName": "",
          "lastName": ""
        },
        "query": null
      },
      {
        "verb": "POST",
        "path": "login",
        "summary": "Username, email yoki telefon orqali tizimga kirish",
        "perm": "",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "login": "",
          "password": ""
        },
        "query": null
      },
      {
        "verb": "POST",
        "path": "refresh",
        "summary": "Refresh tokenni yangilash va yangi token juftligini berish",
        "perm": "",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "refreshToken": ""
        },
        "query": null
      },
      {
        "verb": "POST",
        "path": "logout",
        "summary": "Refresh tokenni bekor qilish",
        "perm": "",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "refreshToken": ""
        },
        "query": null
      }
    ]
  },
  {
    "module": "communication",
    "label": "Aloqa",
    "icon": "MessagesSquare",
    "tag": "Communication",
    "base": "communication",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "templates",
        "summary": "",
        "perm": "COMMUNICATION_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "templates",
        "summary": "",
        "perm": "COMMUNICATION_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "code": "",
          "channel": "",
          "subject": "",
          "body": "",
          "variables": [],
          "active": false
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "templates/:id",
        "summary": "",
        "perm": "COMMUNICATION_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "campaigns",
        "summary": "",
        "perm": "COMMUNICATION_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "campaigns",
        "summary": "",
        "perm": "COMMUNICATION_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "channel": "",
          "templateId": "",
          "subject": "",
          "body": "",
          "scheduledAt": "",
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "campaigns/:id",
        "summary": "",
        "perm": "COMMUNICATION_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "deliveries",
        "summary": "",
        "perm": "COMMUNICATION_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "deliveries",
        "summary": "",
        "perm": "COMMUNICATION_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "campaignId": "",
          "channel": "",
          "recipientType": "",
          "recipientId": "",
          "destination": "",
          "subject": "",
          "body": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "deliveries/:id",
        "summary": "",
        "perm": "COMMUNICATION_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {
          "status": "",
          "providerMessageId": "",
          "errorMessage": ""
        },
        "query": null
      }
    ]
  },
  {
    "module": "counseling",
    "label": "Psixolog",
    "icon": "HeartHandshake",
    "tag": "Psixolog (maxfiy)",
    "base": "counseling",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "sessions",
        "summary": "",
        "perm": "COUNSELING_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "GET",
        "path": "sessions/:id",
        "summary": "",
        "perm": "COUNSELING_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "GET",
        "path": "students/:id/sessions",
        "summary": "",
        "perm": "COUNSELING_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "sessions",
        "summary": "",
        "perm": "COUNSELING_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "studentId": "",
          "counselorId": "",
          "sessionDate": "",
          "sessionType": "",
          "notes": "",
          "riskLevel": "",
          "followUpDate": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "sessions/:id",
        "summary": "",
        "perm": "COUNSELING_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      }
    ]
  },
  {
    "module": "crm",
    "label": "CRM / Lidlar",
    "icon": "UserPlus",
    "tag": "CRM",
    "base": "crm/leads",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "",
        "summary": "CRM lidlarini sahifalab olish",
        "perm": "CRM_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": {
          "search": "",
          "page": 1,
          "limit": 20
        }
      },
      {
        "verb": "POST",
        "path": "",
        "summary": "CRM lid yaratish",
        "perm": "CRM_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "firstName": "",
          "lastName": "",
          "phone": "",
          "email": "",
          "status": "",
          "sourceId": "",
          "stageId": "",
          "assignedToId": "",
          "notes": "",
          "referralCode": ""
        },
        "query": null
      },
      {
        "verb": "GET",
        "path": ":id",
        "summary": "Lidni ID bo‘yicha olish",
        "perm": "CRM_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "PATCH",
        "path": ":id",
        "summary": "CRM lidni tahrirlash",
        "perm": "CRM_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      }
    ]
  },
  {
    "module": "documents",
    "label": "Hujjatlar",
    "icon": "FileText",
    "tag": "Documents",
    "base": "documents",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "templates",
        "summary": "",
        "perm": "DOCUMENTS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "templates",
        "summary": "",
        "perm": "DOCUMENTS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "code": "",
          "body": "",
          "variables": [],
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "templates/:id",
        "summary": "",
        "perm": "DOCUMENTS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "",
        "summary": "",
        "perm": "DOCUMENTS_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "generate",
        "summary": "",
        "perm": "DOCUMENTS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "templateId": "",
          "ownerType": "",
          "ownerId": "",
          "content": "",
          "fileUrl": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": ":id",
        "summary": "",
        "perm": "DOCUMENTS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {
          "content": "",
          "fileUrl": "",
          "status": ""
        },
        "query": null
      },
      {
        "verb": "GET",
        "path": "sign-requests/list",
        "summary": "",
        "perm": "DOCUMENTS_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "sign-requests",
        "summary": "",
        "perm": "DOCUMENTS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "documentId": "",
          "signerId": "",
          "signerType": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "sign-requests/:id",
        "summary": "",
        "perm": "DOCUMENTS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {
          "status": "",
          "rejectReason": ""
        },
        "query": null
      }
    ]
  },
  {
    "module": "feedback",
    "label": "Fikr-mulohaza",
    "icon": "Star",
    "tag": "Feedback",
    "base": "feedback",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "tickets",
        "summary": "",
        "perm": "FEEDBACK_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "tickets",
        "summary": "",
        "perm": "FEEDBACK_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "senderId": "",
          "studentId": "",
          "subject": "",
          "rating": 0
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "tickets/:id",
        "summary": "",
        "perm": "FEEDBACK_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {
          "status": "",
          "assignedTo": ""
        },
        "query": null
      },
      {
        "verb": "GET",
        "path": "tickets/:id/comments",
        "summary": "",
        "perm": "FEEDBACK_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "comments",
        "summary": "",
        "perm": "FEEDBACK_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "ticketId": "",
          "authorId": "",
          "isInternal": false
        },
        "query": null
      }
    ]
  },
  {
    "module": "files",
    "label": "Fayllar",
    "icon": "Files",
    "tag": "Fayllar",
    "base": "files",
    "versionNeutral": false,
    "endpoints": []
  },
  {
    "module": "finance",
    "label": "Moliya",
    "icon": "Wallet",
    "tag": "Moliya",
    "base": "finance",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "contracts",
        "summary": "Shartnomalar ro‘yxatini olish",
        "perm": "FINANCE_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "contracts",
        "summary": "O‘quvchi shartnomasini yaratish",
        "perm": "FINANCE_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "studentId": "",
          "contractTypeId": "",
          "issueDate": "",
          "totalAmount": 0,
          "status": ""
        },
        "query": null
      },
      {
        "verb": "POST",
        "path": "contracts/:id/payments",
        "summary": "Shartnoma bo‘yicha to‘lov kiritish",
        "perm": "FINANCE_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {
          "amount": 0,
          "paymentDate": "",
          "method": "",
          "transactionId": ""
        },
        "query": null
      },
      {
        "verb": "GET",
        "path": "contracts/:id/debt",
        "summary": "Shartnoma qarzdorligini hisoblash",
        "perm": "FINANCE_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      }
    ]
  },
  {
    "module": "gamification",
    "label": "Gamifikatsiya",
    "icon": "Trophy",
    "tag": "Gamification",
    "base": "gamification",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "badges",
        "summary": "",
        "perm": "GAMIFICATION_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "badges",
        "summary": "",
        "perm": "GAMIFICATION_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "iconUrl": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "badges/:id",
        "summary": "",
        "perm": "GAMIFICATION_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "POST",
        "path": "badges/award",
        "summary": "",
        "perm": "GAMIFICATION_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "studentId": "",
          "badgeId": "",
          "awardedBy": "",
          "awardedReason": ""
        },
        "query": null
      },
      {
        "verb": "GET",
        "path": "wallets/:id",
        "summary": "",
        "perm": "GAMIFICATION_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "coins",
        "summary": "",
        "perm": "GAMIFICATION_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "studentId": "",
          "amount": 0,
          "reason": "",
          "sourceType": "",
          "sourceId": ""
        },
        "query": null
      },
      {
        "verb": "GET",
        "path": "coins",
        "summary": "",
        "perm": "GAMIFICATION_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": null
      }
    ]
  },
  {
    "module": "health",
    "label": "Sogʻliq (tizim)",
    "icon": "Activity",
    "tag": "Sog‘liq",
    "base": "health",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "",
        "summary": "Sog‘liq holatini tekshirish",
        "perm": "",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      }
    ]
  },
  {
    "module": "health-safety",
    "label": "Sogʻliq va xavfsizlik",
    "icon": "ShieldPlus",
    "tag": "Health & Safety",
    "base": "health-safety",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "records",
        "summary": "",
        "perm": "HEALTH_SAFETY_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "records",
        "summary": "",
        "perm": "HEALTH_SAFETY_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "studentId": "",
          "bloodType": "",
          "allergies": "",
          "medicalNotes": "",
          "emergencyContact": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "records/:id",
        "summary": "",
        "perm": "HEALTH_SAFETY_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "nurse-visits",
        "summary": "",
        "perm": "HEALTH_SAFETY_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "nurse-visits",
        "summary": "",
        "perm": "HEALTH_SAFETY_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "studentId": "",
          "visitedAt": "",
          "complaint": "",
          "treatment": "",
          "followUpRequired": false
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "nurse-visits/:id",
        "summary": "",
        "perm": "HEALTH_SAFETY_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "incidents",
        "summary": "",
        "perm": "HEALTH_SAFETY_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "incidents",
        "summary": "",
        "perm": "HEALTH_SAFETY_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "incidentAt": "",
          "location": "",
          "severity": "",
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "incidents/:id",
        "summary": "",
        "perm": "HEALTH_SAFETY_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "drills",
        "summary": "",
        "perm": "HEALTH_SAFETY_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "drills",
        "summary": "",
        "perm": "HEALTH_SAFETY_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "drillDate": "",
          "drillType": "",
          "participantsCount": 0,
          "notes": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "drills/:id",
        "summary": "",
        "perm": "HEALTH_SAFETY_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      }
    ]
  },
  {
    "module": "homework",
    "label": "Uy vazifasi",
    "icon": "NotebookPen",
    "tag": "Homework",
    "base": "homework",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "assignments",
        "summary": "",
        "perm": "LMS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "assignments",
        "summary": "",
        "perm": "LMS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "classId": "",
          "subjectId": "",
          "teacherId": "",
          "dueDate": "",
          "maxScore": 0,
          "status": "",
          "attachmentUrls": []
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "assignments/:id",
        "summary": "",
        "perm": "LMS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "submissions",
        "summary": "",
        "perm": "LMS_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "submissions",
        "summary": "",
        "perm": "LMS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "assignmentId": "",
          "studentId": "",
          "answer": "",
          "attachmentUrls": []
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "submissions/:id/check",
        "summary": "",
        "perm": "LMS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {
          "score": 0,
          "teacherComment": "",
          "aiFeedback": "",
          "status": ""
        },
        "query": null
      }
    ]
  },
  {
    "module": "hr",
    "label": "HR / Kadrlar",
    "icon": "Briefcase",
    "tag": "HR",
    "base": "hr",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "departments",
        "summary": "",
        "perm": "HR_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "departments",
        "summary": "",
        "perm": "HR_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "code": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "departments/:id",
        "summary": "",
        "perm": "HR_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "positions",
        "summary": "",
        "perm": "HR_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "positions",
        "summary": "",
        "perm": "HR_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "code": "",
          "baseSalary": 0
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "positions/:id",
        "summary": "",
        "perm": "HR_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "staff",
        "summary": "",
        "perm": "HR_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "GET",
        "path": "staff/:id",
        "summary": "",
        "perm": "HR_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "staff",
        "summary": "",
        "perm": "HR_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "employeeCode": "",
          "userId": "",
          "firstName": "",
          "lastName": "",
          "phone": "",
          "email": "",
          "departmentId": "",
          "positionId": "",
          "hireDate": "",
          "status": "",
          "salary": 0
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "staff/:id",
        "summary": "",
        "perm": "HR_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "leaves",
        "summary": "",
        "perm": "HR_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "leaves",
        "summary": "",
        "perm": "HR_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "staffMemberId": "",
          "startDate": "",
          "endDate": "",
          "reason": "",
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "leaves/:id",
        "summary": "",
        "perm": "HR_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "payrolls",
        "summary": "",
        "perm": "HR_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "payrolls",
        "summary": "",
        "perm": "HR_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "staffMemberId": "",
          "period": "",
          "baseAmount": 0,
          "bonus": 0,
          "deduction": 0,
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "payrolls/:id",
        "summary": "",
        "perm": "HR_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      }
    ]
  },
  {
    "module": "imports-exports",
    "label": "Import / Eksport",
    "icon": "ArrowLeftRight",
    "tag": "Imports / Exports",
    "base": "imports-exports",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "jobs",
        "summary": "",
        "perm": "DATA_JOBS_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "jobs",
        "summary": "",
        "perm": "DATA_JOBS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "entityType": "",
          "fileUrl": "",
          "requestedById": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "jobs/:id",
        "summary": "",
        "perm": "DATA_JOBS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {
          "status": "",
          "totalRows": 0,
          "successRows": 0,
          "failedRows": 0,
          "resultFileUrl": ""
        },
        "query": null
      }
    ]
  },
  {
    "module": "integrations",
    "label": "Integratsiyalar",
    "icon": "Plug",
    "tag": "Integratsiyalar",
    "base": "integrations",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "",
        "summary": "Integratsiyalar ro‘yxatini olish",
        "perm": "INTEGRATIONS_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": {
          "search": "",
          "category": "",
          "isEnabled": "",
          "page": 1,
          "limit": 20
        }
      },
      {
        "verb": "POST",
        "path": "",
        "summary": "Integratsiya yaratish",
        "perm": "INTEGRATIONS_MANAGE",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "GET",
        "path": ":id",
        "summary": "Integratsiyani ID bo‘yicha olish",
        "perm": "INTEGRATIONS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "PATCH",
        "path": ":id",
        "summary": "Integratsiyani qisman tahrirlash",
        "perm": "INTEGRATIONS_MANAGE",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "DELETE",
        "path": ":id",
        "summary": "Integratsiyani arxivlash",
        "perm": "INTEGRATIONS_MANAGE",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      }
    ]
  },
  {
    "module": "inventory",
    "label": "Inventar",
    "icon": "PackageOpen",
    "tag": "Inventory",
    "base": "inventory",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "categories",
        "summary": "",
        "perm": "INVENTORY_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "categories",
        "summary": "",
        "perm": "INVENTORY_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "code": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "categories/:id",
        "summary": "",
        "perm": "INVENTORY_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "items",
        "summary": "",
        "perm": "INVENTORY_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "GET",
        "path": "items/:id",
        "summary": "",
        "perm": "INVENTORY_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "items",
        "summary": "",
        "perm": "INVENTORY_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "assetCode": "",
          "categoryId": "",
          "roomId": "",
          "purchaseDate": "",
          "purchasePrice": 0,
          "status": "",
          "note": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "items/:id",
        "summary": "",
        "perm": "INVENTORY_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "transactions",
        "summary": "",
        "perm": "INVENTORY_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "transactions",
        "summary": "",
        "perm": "INVENTORY_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "itemId": "",
          "quantity": 0,
          "comment": ""
        },
        "query": null
      }
    ]
  },
  {
    "module": "kpi",
    "label": "KPI",
    "icon": "Target",
    "tag": "KPI",
    "base": "kpi",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "metrics",
        "summary": "",
        "perm": "KPI_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "metrics",
        "summary": "",
        "perm": "KPI_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "code": "",
          "targetType": "",
          "weight": 0,
          "isActive": false
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "metrics/:id",
        "summary": "",
        "perm": "KPI_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "results",
        "summary": "",
        "perm": "KPI_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "results",
        "summary": "",
        "perm": "KPI_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "metricId": "",
          "targetType": "",
          "targetId": "",
          "periodType": "",
          "periodStart": "",
          "periodEnd": "",
          "target": 0,
          "score": 0,
          "comment": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "results/:id",
        "summary": "",
        "perm": "KPI_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      }
    ]
  },
  {
    "module": "library",
    "label": "Kutubxona",
    "icon": "Library",
    "tag": "Library",
    "base": "library",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "books",
        "summary": "",
        "perm": "LIBRARY_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "books",
        "summary": "",
        "perm": "LIBRARY_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "author": "",
          "isbn": "",
          "category": "",
          "publisher": "",
          "publishedYear": 0
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "books/:id",
        "summary": "",
        "perm": "LIBRARY_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "copies",
        "summary": "",
        "perm": "LIBRARY_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "copies",
        "summary": "",
        "perm": "LIBRARY_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "bookId": "",
          "barcode": "",
          "status": "",
          "location": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "copies/:id",
        "summary": "",
        "perm": "LIBRARY_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "loans",
        "summary": "",
        "perm": "LIBRARY_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "loans",
        "summary": "",
        "perm": "LIBRARY_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "copyId": "",
          "studentId": "",
          "staffMemberId": "",
          "loanedAt": "",
          "dueDate": "",
          "returnedAt": "",
          "fineAmount": 0,
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "loans/:id",
        "summary": "",
        "perm": "LIBRARY_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "reservations",
        "summary": "",
        "perm": "LIBRARY_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "reservations",
        "summary": "",
        "perm": "LIBRARY_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "bookId": "",
          "studentId": "",
          "staffMemberId": "",
          "reservedAt": "",
          "expiresAt": "",
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "reservations/:id",
        "summary": "",
        "perm": "LIBRARY_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      }
    ]
  },
  {
    "module": "lms",
    "label": "LMS",
    "icon": "MonitorPlay",
    "tag": "LMS",
    "base": "lms",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "lessons",
        "summary": "",
        "perm": "LMS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "lessons",
        "summary": "",
        "perm": "LMS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "classId": "",
          "subjectId": "",
          "teacherId": "",
          "roomId": "",
          "lessonPeriodId": "",
          "lessonDate": "",
          "status": "",
          "topic": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "lessons/:id",
        "summary": "",
        "perm": "LMS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "journal",
        "summary": "",
        "perm": "LMS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "journal",
        "summary": "",
        "perm": "LMS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "lessonId": "",
          "studentId": "",
          "grade": 0,
          "homeworkDone": false,
          "comment": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "journal/:id",
        "summary": "",
        "perm": "LMS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "exams",
        "summary": "",
        "perm": "LMS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "exams",
        "summary": "",
        "perm": "LMS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "classId": "",
          "subjectId": "",
          "examDate": "",
          "maxScore": 0,
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "exams/:id",
        "summary": "",
        "perm": "LMS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "exam-results",
        "summary": "",
        "perm": "LMS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "exam-results",
        "summary": "",
        "perm": "LMS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "examId": "",
          "studentId": "",
          "score": 0,
          "comment": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "exam-results/:id",
        "summary": "",
        "perm": "LMS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      }
    ]
  },
  {
    "module": "metrics",
    "label": "Metrikalar",
    "icon": "Gauge",
    "tag": "Operatsion metrikalar",
    "base": "metrics",
    "versionNeutral": true,
    "endpoints": [
      {
        "verb": "GET",
        "path": "",
        "summary": "Prometheus metrikalari",
        "perm": "",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      }
    ]
  },
  {
    "module": "mobile-portal",
    "label": "Mobil portal",
    "icon": "Smartphone",
    "tag": "Mobile Parent Portal",
    "base": "mobile-portal",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "parents/:id/children",
        "summary": "",
        "perm": "MOBILE_PORTAL_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "GET",
        "path": "children/:id/overview",
        "summary": "",
        "perm": "MOBILE_PORTAL_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "GET",
        "path": "meals",
        "summary": "",
        "perm": "MOBILE_PORTAL_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": {
          "studentId": "",
          "from": "",
          "to": ""
        }
      }
    ]
  },
  {
    "module": "notifications",
    "label": "Bildirishnomalar",
    "icon": "Bell",
    "tag": "Bildirishnomalar",
    "base": "notifications",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "templates",
        "summary": "Bildirishnoma shablonlari ro‘yxatini olish",
        "perm": "NOTIFICATIONS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "templates",
        "summary": "Bildirishnoma shablonini yaratish",
        "perm": "NOTIFICATIONS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "channel": "",
          "translations": []
        },
        "query": null
      },
      {
        "verb": "POST",
        "path": "queue",
        "summary": "Bildirishnomani yuborish navbatiga qo‘yish",
        "perm": "NOTIFICATIONS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "templateId": "",
          "recipientType": "",
          "recipientId": "",
          "channel": ""
        },
        "query": null
      }
    ]
  },
  {
    "module": "procurement",
    "label": "Xaridlar",
    "icon": "ShoppingCart",
    "tag": "Procurement",
    "base": "procurement",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "vendors",
        "summary": "",
        "perm": "PROCUREMENT_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "vendors",
        "summary": "",
        "perm": "PROCUREMENT_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "phone": "",
          "email": "",
          "taxNumber": "",
          "address": "",
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "vendors/:id",
        "summary": "",
        "perm": "PROCUREMENT_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "requests",
        "summary": "",
        "perm": "PROCUREMENT_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "requests",
        "summary": "",
        "perm": "PROCUREMENT_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "requestNo": "",
          "requestedById": "",
          "departmentId": "",
          "purpose": "",
          "estimatedAmount": 0,
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "requests/:id",
        "summary": "",
        "perm": "PROCUREMENT_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "orders",
        "summary": "",
        "perm": "PROCUREMENT_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "orders",
        "summary": "",
        "perm": "PROCUREMENT_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "orderNo": "",
          "vendorId": "",
          "requestId": "",
          "orderDate": "",
          "totalAmount": 0,
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "orders/:id",
        "summary": "",
        "perm": "PROCUREMENT_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "receipts",
        "summary": "",
        "perm": "PROCUREMENT_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "receipts",
        "summary": "",
        "perm": "PROCUREMENT_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "receiptNo": "",
          "purchaseOrderId": "",
          "receivedAt": "",
          "receivedById": "",
          "notes": "",
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "receipts/:id",
        "summary": "",
        "perm": "PROCUREMENT_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      }
    ]
  },
  {
    "module": "reports",
    "label": "Hisobotlar",
    "icon": "FileBarChart",
    "tag": "Reports",
    "base": "reports",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "cashflow",
        "summary": "",
        "perm": "REPORTS_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": {
          "from": "",
          "to": ""
        }
      },
      {
        "verb": "GET",
        "path": "profit-loss",
        "summary": "",
        "perm": "REPORTS_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": {
          "from": "",
          "to": ""
        }
      },
      {
        "verb": "GET",
        "path": "payments-by-method",
        "summary": "",
        "perm": "REPORTS_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": {
          "from": "",
          "to": ""
        }
      },
      {
        "verb": "GET",
        "path": "academic-overview",
        "summary": "",
        "perm": "REPORTS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      }
    ]
  },
  {
    "module": "roles",
    "label": "Rollar",
    "icon": "Users",
    "tag": "Rollar",
    "base": "roles",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "",
        "summary": "Rollar ro‘yxatini olish",
        "perm": "ROLES_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": {
          "search": "",
          "page": 1,
          "limit": 20
        }
      },
      {
        "verb": "POST",
        "path": "",
        "summary": "Rol yaratish",
        "perm": "ROLES_MANAGE",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "GET",
        "path": ":id",
        "summary": "Rolni ID bo‘yicha olish",
        "perm": "ROLES_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "PATCH",
        "path": ":id",
        "summary": "Rolni qisman tahrirlash",
        "perm": "ROLES_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "DELETE",
        "path": ":id",
        "summary": "Rolni arxivlash",
        "perm": "ROLES_MANAGE",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      }
    ]
  },
  {
    "module": "rooms",
    "label": "Xonalar",
    "icon": "DoorOpen",
    "tag": "Xonalar",
    "base": "settings/rooms",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "",
        "summary": "Xonalar ro‘yxatini olish",
        "perm": "SETTINGS_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": {
          "floor": "",
          "search": ""
        }
      },
      {
        "verb": "POST",
        "path": "",
        "summary": "Xona yaratish",
        "perm": "SETTINGS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "floor": 0,
          "roomNumber": ""
        },
        "query": null
      },
      {
        "verb": "GET",
        "path": ":id",
        "summary": "Xonani ID bo‘yicha olish",
        "perm": "SETTINGS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "PATCH",
        "path": ":id",
        "summary": "Xonani tahrirlash",
        "perm": "SETTINGS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "DELETE",
        "path": ":id",
        "summary": "Xonani arxivlash",
        "perm": "SETTINGS_MANAGE",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      }
    ]
  },
  {
    "module": "schools",
    "label": "Maktablar",
    "icon": "School",
    "tag": "Maktab maʼlumotlari",
    "base": "schools",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "",
        "summary": "Maktablar ro‘yxatini olish",
        "perm": "SETTINGS_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": {
          "search": "",
          "schoolType": "",
          "status": "",
          "page": 1,
          "limit": 20
        }
      },
      {
        "verb": "POST",
        "path": "",
        "summary": "Maktab yaratish",
        "perm": "SETTINGS_MANAGE",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "GET",
        "path": ":id",
        "summary": "Maktabni ID bo‘yicha olish",
        "perm": "SETTINGS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "PATCH",
        "path": ":id",
        "summary": "Maktabni tahrirlash",
        "perm": "SETTINGS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {
          "status": ""
        },
        "query": null
      },
      {
        "verb": "DELETE",
        "path": ":id",
        "summary": "Maktabni arxivlash",
        "perm": "SETTINGS_MANAGE",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      }
    ]
  },
  {
    "module": "settings",
    "label": "Sozlamalar",
    "icon": "Settings",
    "tag": "Sozlamalar",
    "base": "settings",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "school",
        "summary": "Maktab profili va filiallarini olish",
        "perm": "SETTINGS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "PUT",
        "path": "school",
        "summary": "Maktab profilini yaratish yoki tahrirlash",
        "perm": "SETTINGS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "address": "",
          "contactEmail": "",
          "contactPhone": "",
          "currency": "",
          "timezone": "",
          "language": ""
        },
        "query": null
      }
    ]
  },
  {
    "module": "students",
    "label": "Oʻquvchilar",
    "icon": "Users",
    "tag": "O‘quvchilar",
    "base": "students",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "",
        "summary": "O‘quvchilar ro‘yxatini sahifalab olish",
        "perm": "STUDENTS_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": {
          "search": "",
          "page": 1,
          "limit": 20
        }
      },
      {
        "verb": "POST",
        "path": "",
        "summary": "O‘quvchi yaratish",
        "perm": "STUDENTS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "firstName": "",
          "lastName": "",
          "birthDate": "",
          "gender": "",
          "studentCode": "",
          "status": "",
          "nationalId": ""
        },
        "query": null
      },
      {
        "verb": "GET",
        "path": ":id",
        "summary": "O‘quvchini ID bo‘yicha olish",
        "perm": "STUDENTS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "PATCH",
        "path": ":id",
        "summary": "O‘quvchini tahrirlash",
        "perm": "STUDENTS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "POST",
        "path": "parents",
        "summary": "Ota-ona yoki vasiy yozuvini yaratish",
        "perm": "STUDENTS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "firstName": "",
          "lastName": "",
          "phone": "",
          "email": ""
        },
        "query": null
      },
      {
        "verb": "POST",
        "path": ":id/parents",
        "summary": "Ota-ona yoki vasiyni o‘quvchiga bog‘lash",
        "perm": "STUDENTS_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {
          "parentId": "",
          "relation": "",
          "isPrimary": false
        },
        "query": null
      }
    ]
  },
  {
    "module": "timetable",
    "label": "Dars jadvali",
    "icon": "CalendarClock",
    "tag": "Timetable",
    "base": "timetable",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "templates",
        "summary": "",
        "perm": "TIMETABLE_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "templates",
        "summary": "",
        "perm": "TIMETABLE_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "academicYearId": "",
          "classId": "",
          "isActive": false
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "templates/:id",
        "summary": "",
        "perm": "TIMETABLE_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "slots",
        "summary": "",
        "perm": "TIMETABLE_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "slots",
        "summary": "",
        "perm": "TIMETABLE_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "templateId": "",
          "classId": "",
          "subjectId": "",
          "teacherId": "",
          "roomId": "",
          "weekday": 0,
          "startTime": "",
          "endTime": "",
          "notes": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "slots/:id",
        "summary": "",
        "perm": "TIMETABLE_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "substitutions",
        "summary": "",
        "perm": "TIMETABLE_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "substitutions",
        "summary": "",
        "perm": "TIMETABLE_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "slotId": "",
          "originalTeacherId": "",
          "substituteTeacherId": "",
          "date": "",
          "reason": "",
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "substitutions/:id",
        "summary": "",
        "perm": "TIMETABLE_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "conflicts",
        "summary": "",
        "perm": "TIMETABLE_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "conflicts",
        "summary": "",
        "perm": "TIMETABLE_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "slotId": "",
          "conflictType": "",
          "resolved": false
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "conflicts/:id",
        "summary": "",
        "perm": "TIMETABLE_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      }
    ]
  },
  {
    "module": "transport",
    "label": "Transport",
    "icon": "Bus",
    "tag": "Transport",
    "base": "transport",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "vehicles",
        "summary": "",
        "perm": "TRANSPORT_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "vehicles",
        "summary": "",
        "perm": "TRANSPORT_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "plateNumber": "",
          "model": "",
          "capacity": 0,
          "driverId": "",
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "vehicles/:id",
        "summary": "",
        "perm": "TRANSPORT_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "routes",
        "summary": "",
        "perm": "TRANSPORT_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "routes",
        "summary": "",
        "perm": "TRANSPORT_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "vehicleId": "",
          "driverId": "",
          "startTime": "",
          "endTime": "",
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "routes/:id",
        "summary": "",
        "perm": "TRANSPORT_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "stops",
        "summary": "",
        "perm": "TRANSPORT_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "stops",
        "summary": "",
        "perm": "TRANSPORT_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "routeId": "",
          "orderIndex": 0,
          "arrivalTime": "",
          "latitude": 0,
          "longitude": 0
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "stops/:id",
        "summary": "",
        "perm": "TRANSPORT_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "assignments",
        "summary": "",
        "perm": "TRANSPORT_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "assignments",
        "summary": "",
        "perm": "TRANSPORT_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "studentId": "",
          "routeId": "",
          "pickupStopId": "",
          "dropoffStopId": "",
          "monthlyFee": 0,
          "active": false
        },
        "query": null
      },
      {
        "verb": "GET",
        "path": "trips",
        "summary": "",
        "perm": "TRANSPORT_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "trips",
        "summary": "",
        "perm": "TRANSPORT_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "routeId": "",
          "vehicleId": "",
          "driverId": "",
          "tripDate": "",
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "trips/:id",
        "summary": "",
        "perm": "TRANSPORT_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      }
    ]
  },
  {
    "module": "users",
    "label": "Foydalanuvchilar",
    "icon": "UserCog",
    "tag": "Foydalanuvchilar",
    "base": "users",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "",
        "summary": "Foydalanuvchilar ro‘yxatini olish",
        "perm": "USERS_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": {
          "search": "",
          "role": "",
          "gender": "",
          "status": "",
          "page": 1,
          "limit": 20
        }
      },
      {
        "verb": "POST",
        "path": "",
        "summary": "Foydalanuvchi yaratish",
        "perm": "USERS_CREATE",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "GET",
        "path": ":id",
        "summary": "Foydalanuvchini ID bo‘yicha olish",
        "perm": "USERS_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "PATCH",
        "path": ":id",
        "summary": "Foydalanuvchini qisman tahrirlash",
        "perm": "USERS_UPDATE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {
          "status": "",
          "password": ""
        },
        "query": null
      },
      {
        "verb": "DELETE",
        "path": ":id",
        "summary": "Foydalanuvchini arxivlash",
        "perm": "USERS_UPDATE",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": null,
        "query": null
      },
      {
        "verb": "PATCH",
        "path": ":id/roles",
        "summary": "Foydalanuvchi rollarini almashtirish",
        "perm": "ROLES_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {
          "roleNames": []
        },
        "query": null
      }
    ]
  },
  {
    "module": "workflow",
    "label": "Jarayonlar",
    "icon": "Workflow",
    "tag": "Workflow",
    "base": "workflow",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "approvals",
        "summary": "",
        "perm": "WORKFLOW_READ",
        "hasBody": false,
        "hasQuery": true,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "approvals",
        "summary": "",
        "perm": "WORKFLOW_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "entityType": "",
          "entityId": "",
          "requestedById": "",
          "approverId": "",
          "priority": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "approvals/:id/decision",
        "summary": "",
        "perm": "WORKFLOW_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {
          "status": "",
          "decisionComment": ""
        },
        "query": null
      }
    ]
  },
  {
    "module": "youth-services",
    "label": "Yoshlar xizmati",
    "icon": "Sparkles",
    "tag": "Youth services",
    "base": "youth-services",
    "versionNeutral": false,
    "endpoints": [
      {
        "verb": "GET",
        "path": "meal-menus",
        "summary": "",
        "perm": "YOUTH_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "meal-menus",
        "summary": "",
        "perm": "YOUTH_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "menuDate": "",
          "mealType": "",
          "calories": 0,
          "allergens": []
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "meal-menus/:id",
        "summary": "",
        "perm": "YOUTH_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      },
      {
        "verb": "GET",
        "path": "requests",
        "summary": "",
        "perm": "YOUTH_READ",
        "hasBody": false,
        "hasQuery": false,
        "pathParams": [],
        "body": null,
        "query": null
      },
      {
        "verb": "POST",
        "path": "requests",
        "summary": "",
        "perm": "YOUTH_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [],
        "body": {
          "studentId": "",
          "category": "",
          "status": ""
        },
        "query": null
      },
      {
        "verb": "PATCH",
        "path": "requests/:id",
        "summary": "",
        "perm": "YOUTH_MANAGE",
        "hasBody": true,
        "hasQuery": false,
        "pathParams": [
          "id"
        ],
        "body": {},
        "query": null
      }
    ]
  }
];
export const API_TOTAL_ENDPOINTS = 304;
