export type PreferenceOption = {
  label: string;
  keywords?: string[];
};

export type PreferenceGroup = {
  label: string;
  options: PreferenceOption[];
};

export const preferenceGroups: PreferenceGroup[] = [
  {
    label: 'Technology & IT',
    options: [
      'Software Engineering', 'Information Technology', 'Artificial Intelligence', 'Machine Learning',
      'Data Science', 'Data Analytics', 'Cloud Computing', 'Cybersecurity', 'DevOps', 'Blockchain',
      'Internet of Things', 'Embedded Systems', 'Networking', 'Robotics', 'UI/UX Design', 'Web Development',
      'Mobile Development', 'Game Development', 'Information Systems',
    ].map((label) => ({ label })),
  },
  {
    label: 'Business & Finance',
    options: [
      'Banking', 'Finance', 'Accounting', 'Investment Banking', 'FinTech', 'Business Analytics',
      'Management', 'Consulting', 'Human Resources', 'Marketing', 'Sales', 'Entrepreneurship',
      'Economics', 'Operations', 'Product Management', 'Customer Success',
    ].map((label) => ({ label })),
  },
  {
    label: 'Engineering & Manufacturing',
    options: [
      'Mechanical Engineering', 'Electrical Engineering', 'Electronics', 'Civil Engineering',
      'Chemical Engineering', 'Automotive', 'Aerospace', 'Manufacturing', 'Industrial Engineering',
      'Renewable Energy', 'Materials Science', 'Environmental Engineering',
    ].map((label) => ({ label })),
  },
  {
    label: 'Healthcare & Life Sciences',
    options: [
      'Healthcare', 'Medicine', 'Biotechnology', 'Pharmaceuticals', 'Nursing', 'Medical Research',
      'Public Health', 'Biomedical Engineering', 'Clinical Research', 'Nutrition',
    ].map((label) => ({ label })),
  },
  {
    label: 'Other industries',
    options: [
      'Education', 'Research', 'Agriculture', 'Government & Public Services', 'Law', 'Legal Services',
      'Retail', 'E-commerce', 'Logistics', 'Supply Chain Management', 'Telecommunications', 'Media',
      'Entertainment', 'Hospitality', 'Tourism', 'Real Estate', 'Construction', 'Sustainability',
      'Transportation', 'Insurance', 'Nonprofit', 'Architecture', 'Fashion',
    ].map((label) => ({ label })),
  },
];

export const domainOptions = preferenceGroups.flatMap((group) => group.options);

export const roleOptions: PreferenceOption[] = [
  'Software Engineer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer',
  'Android Developer', 'iOS Developer', 'Data Analyst', 'Data Scientist', 'Machine Learning Engineer',
  'AI Engineer', 'Cloud Engineer', 'DevOps Engineer', 'Cybersecurity Analyst', 'Security Engineer',
  'Product Manager', 'Business Analyst', 'UI/UX Designer', 'QA Engineer', 'Test Automation Engineer',
  'Database Administrator', 'Network Engineer', 'Embedded Systems Engineer', 'Financial Analyst',
  'Research Engineer', 'Product Designer', 'Project Manager', 'Solutions Architect', 'Technical Writer',
  'Data Engineer', 'Mobile App Developer', 'Operations Manager', 'Marketing Manager', 'Sales Engineer',
].map((label) => ({ label }));

export const workModeOptions: PreferenceOption[] = [
  { label: 'Any Work Mode', keywords: ['no preference'] },
  { label: 'Remote', keywords: ['work from home', 'distributed'] },
  { label: 'Hybrid', keywords: ['office and home', 'flexible office'] },
  { label: 'On-site', keywords: ['onsite', 'office'] },
  { label: 'Work from Anywhere', keywords: ['global remote', 'location independent'] },
  { label: 'Flexible', keywords: ['flexible schedule'] },
];

export const experienceOptions: PreferenceOption[] = [
  { label: 'Student / No experience', keywords: ['entry level', 'fresher'] },
  { label: '0–2 years', keywords: ['entry level', 'junior'] },
  { label: '2–5 years', keywords: ['mid level'] },
  { label: '5–10 years', keywords: ['senior'] },
  { label: '10+ years', keywords: ['lead', 'principal'] },
];

export const countryCodes = [
  'AF','AX','AL','DZ','AS','AD','AO','AI','AQ','AG','AR','AM','AW','AU','AT','AZ','BS','BH','BD','BB','BY','BE','BZ','BJ',
  'BM','BT','BO','BQ','BA','BW','BV','BR','IO','BN','BG','BF','BI','CV','KH','CM','CA','KY','CF','TD','CL','CN','CX','CC',
  'CO','KM','CG','CD','CK','CR','CI','HR','CU','CW','CY','CZ','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET',
  'FK','FO','FJ','FI','FR','GF','PF','TF','GA','GM','GE','DE','GH','GI','GR','GL','GD','GP','GU','GT','GG','GN','GW','GY',
  'HT','HM','VA','HN','HK','HU','IS','IN','ID','IR','IQ','IE','IM','IL','IT','JM','JP','JE','JO','KZ','KE','KI','KP','KR',
  'KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MO','MG','MW','MY','MV','ML','MT','MH','MQ','MR','MU','YT','MX',
  'FM','MD','MC','MN','ME','MS','MA','MZ','MM','NA','NR','NP','NL','NC','NZ','NI','NE','NG','NU','NF','MK','MP','NO','OM',
  'PK','PW','PS','PA','PG','PY','PE','PH','PN','PL','PT','PR','QA','RE','RO','RU','RW','BL','SH','KN','LC','MF','PM','VC',
  'WS','SM','ST','SA','SN','RS','SC','SL','SG','SX','SK','SI','SB','SO','ZA','GS','SS','ES','LK','SD','SR','SJ','SE','CH',
  'SY','TW','TJ','TZ','TH','TL','TG','TK','TO','TT','TN','TR','TM','TC','TV','UG','UA','AE','GB','US','UM','UY','UZ','VU',
  'VE','VN','VG','VI','WF','EH','YE','ZM','ZW',
] as const;

export function countryName(code: string) {
  const normalizedCode = code.toUpperCase();
  const fallbackNames: Record<string, string> = {
    IN: 'India',
    ID: 'Indonesia',
    IR: 'Iran',
    IQ: 'Iraq',
    IE: 'Ireland',
    IL: 'Israel',
    IT: 'Italy',
    US: 'United States',
    GB: 'United Kingdom',
    CA: 'Canada',
    AU: 'Australia',
    DE: 'Germany',
    FR: 'France',
    JP: 'Japan',
    CN: 'China',
    PK: 'Pakistan',
  };
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(normalizedCode) ?? fallbackNames[normalizedCode] ?? normalizedCode;
  } catch {
    return fallbackNames[normalizedCode] ?? normalizedCode;
  }
}

export function countryFlag(code: string) {
  return code.toUpperCase().replace(/[A-Z]/g, (letter) => String.fromCodePoint(letter.charCodeAt(0) + 127397));
}
