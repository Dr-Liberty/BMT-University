import { type User, type InsertUser, type AboutPage, type UpdateAboutPage, type RoadmapItem } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAboutPage(): Promise<AboutPage>;
  updateAboutPage(data: UpdateAboutPage): Promise<AboutPage>;
}

// Default about page content
const defaultAboutPage: AboutPage = {
  id: 'default',
  description: `Bitcoin Maxi Tears ($BMT) is the ultimate meme token on the Kaspa blockchain, launched on Kasplex. Every time a Bitcoin maximalist dismisses Kaspa's superior technology, we collect their tears and turn them into tokens.

Built on the fastest proof-of-work blockchain, $BMT combines the power of meme culture with the revolutionary blockDAG technology of Kaspa. Learn, earn, and collect tears with BMT University!

Our mission is to educate the crypto community about the revolutionary potential of Kaspa's blockDAG architecture while having fun along the way. Join us on this journey to collect those sweet, sweet Bitcoin Maxi Tears.`,
  roadmap: [
    {
      id: '1',
      title: 'BMT University Launch',
      description: 'Launch the learning platform with initial courses on Kaspa blockchain fundamentals.',
      status: 'completed',
      targetDate: 'Q4 2024',
    },
    {
      id: '2',
      title: 'Quiz & Certification System',
      description: 'Implement quiz functionality with on-chain certificate issuance and $BMT rewards.',
      status: 'in-progress',
      targetDate: 'Q1 2025',
    },
    {
      id: '3',
      title: 'Multi-Project Platform',
      description: 'Open platform to other Kaspa ecosystem projects with subscription-based white-labeling.',
      status: 'planned',
      targetDate: 'Q2 2025',
    },
    {
      id: '4',
      title: 'Igra Network Integration',
      description: 'Expand to support Igra network for cross-chain learning experiences.',
      status: 'planned',
      targetDate: 'Q3 2025',
    },
  ],
  updatedAt: new Date(),
};

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private aboutPage: AboutPage;

  constructor() {
    this.users = new Map();
    this.aboutPage = { ...defaultAboutPage };
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAboutPage(): Promise<AboutPage> {
    return this.aboutPage;
  }

  async updateAboutPage(data: UpdateAboutPage): Promise<AboutPage> {
    this.aboutPage = {
      ...this.aboutPage,
      description: data.description,
      roadmap: data.roadmap,
      updatedAt: new Date(),
    };
    return this.aboutPage;
  }
}

export const storage = new MemStorage();
