// src/next-auth.d.ts
import "next-auth";

// To make sure TypeScript knows about `id` on `session?.user`
declare module "next-auth" {
  interface User {
    id: string;
  }
  
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
  }
}
