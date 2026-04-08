export interface SubjectInterface {
  _id: string;
  name: string;
  description?: string;
  organizationId: string;
  topics?: TopicInterface[];
}

export interface TopicInterface {
  _id: string;
  name: string;
  subjectId: string;
}

export interface ClassInterface {
  _id: string;
  name: string;
  subjectId: string;
  subjectName?: string;
  teacherName?: string;
}

export interface CommunicationInterface {
  _id: string;
  title: string;
  body: string;
  subjectId?: string;
  subjectName?: string;
  teacherName?: string;
  createdAt: string;
  readBy?: string[];
}

export interface EventInterface {
  _id: string;
  title: string;
  description?: string;
  date: string;
  subjectId?: string;
  subjectName?: string;
  type?: string;
}

export interface MaterialInterface {
  _id: string;
  title: string;
  type: string;
  subjectId: string;
  topicId?: string;
  fileUrl?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
