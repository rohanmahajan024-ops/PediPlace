export interface Sponsor {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  title: string;
  contribution: number;
  status: 'active' | 'pending' | 'inactive';
  lastContact: string;
  category: string;
  type: string;
  city: string;
  state: string;
  avatar: string;
}
