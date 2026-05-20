import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthState } from '../models/auth.model';
import { User, UserRole } from '../models/user.model';

const STORAGE_KEY = 'ynr_auth';

interface UserApiDto {
  id: string;
  phone: string;
  role: UserRole;
  name?: string;
  area?: string;
  photoUrl?: string;
  createdAt: string;
}

interface VerifyResponse {
  success: boolean;
  data: {
    token: string;
    user: UserApiDto;
  };
}

function mapApiUser(u: UserApiDto): User {
  return {
    id: u.id,
    phone: u.phone,
    role: u.role,
    name: u.name,
    area: u.area,
    photoUrl: u.photoUrl,
    createdAt: u.createdAt,
    profileComplete: u.role === 'vendor' ? true : !!(u.name?.trim() && u.area?.trim()),
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authState = signal<AuthState>({
    user: null,
    token: null,
    isLoggedIn: false,
  });

  readonly user = computed(() => this.authState().user);
  readonly token = computed(() => this.authState().token);
  readonly isLoggedIn = computed(() => this.authState().isLoggedIn);
  readonly role = computed(() => this.authState().user?.role ?? null);

  constructor(private readonly http: HttpClient) {
    this.restoreFromStorage();
  }

  async sendOtp(phone: string): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.apiUrl}/auth/send-otp`, { phone }));
  }

  async verifyOtp(phone: string, otp: string, role?: UserRole): Promise<void> {
    const body: { phone: string; otp: string; role?: UserRole } = { phone, otp };
    if (role !== undefined) {
      body.role = role;
    }
    const res = await firstValueFrom(
      this.http.post<VerifyResponse>(`${environment.apiUrl}/auth/verify-otp`, body),
    );
    const user = mapApiUser(res.data.user);
    this.setSession(res.data.token, user);
  }

  /** Refresh user from API (e.g. after profile update). */
  async refreshMe(): Promise<void> {
    const token = this.authState().token;
    if (!token) {
      return;
    }
    const res = await firstValueFrom(
      this.http.get<{ success: boolean; data: UserApiDto }>(`${environment.apiUrl}/users/me`),
    );
    const user = mapApiUser(res.data);
    this.setSession(token, user);
  }

  async patchProfile(patch: { name?: string; area?: string; photoUrl?: string }): Promise<void> {
    const res = await firstValueFrom(
      this.http.patch<{ success: boolean; data: UserApiDto }>(
        `${environment.apiUrl}/users/me`,
        patch,
      ),
    );
    const user = mapApiUser(res.data);
    const token = this.authState().token;
    if (!token) {
      return;
    }
    this.setSession(token, user);
  }

  updateCurrentUser(patch: Partial<User>): void {
    this.authState.update((state) => {
      if (!state.user) {
        return state;
      }

      const nextUser = { ...state.user, ...patch };
      const profileComplete =
        nextUser.role === 'vendor'
          ? true
          : !!(nextUser.name?.trim() && nextUser.area?.trim());

      return {
        ...state,
        user: { ...nextUser, profileComplete },
      };
    });
    this.persist();
  }

  logout(): void {
    this.authState.set({ user: null, token: null, isLoggedIn: false });
    localStorage.removeItem(STORAGE_KEY);
  }

  private setSession(token: string, user: User): void {
    this.authState.set({
      user,
      token,
      isLoggedIn: true,
    });
    this.persist();
  }

  private persist(): void {
    const s = this.authState();
    if (!s.token || !s.user) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: s.token,
        user: {
          id: s.user.id,
          phone: s.user.phone,
          role: s.user.role,
          name: s.user.name,
          area: s.user.area,
          photoUrl: s.user.photoUrl,
          createdAt: s.user.createdAt,
        },
      }),
    );
  }

  private restoreFromStorage(): void {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { token: string; user: UserApiDto };
      if (!parsed.token || !parsed.user?.id) {
        return;
      }
      const user = mapApiUser(parsed.user);
      this.authState.set({
        token: parsed.token,
        user,
        isLoggedIn: true,
      });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
