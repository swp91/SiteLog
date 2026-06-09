"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User } from "lucide-react";
import { Button, Card, TextInput, Field, Segmented } from "@/components/ui";
import { useAppStore } from "@/stores/app-store";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      console.log("LoginPage: getUser user =", user?.email || "none");
      if (user) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        alert(error.message);
      } else {
        router.push("/dashboard");
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || "신규 사용자",
          },
        },
      });
      if (error) {
        alert(error.message);
      } else {
        if (data.session) {
          router.push("/dashboard");
        } else {
          alert("회원가입이 완료되었습니다! 이메일 인증을 확인해 주세요.");
          setMode("login");
        }
      }
    }
  }

  async function handleKakao() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      alert(error.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <img src="/Sitelog-logo.svg" alt="SiteLog Logo" className="w-16 h-16 object-contain" />
          <h1 className="text-[1.375rem] font-bold text-ink">출근로그</h1>
          <p className="text-sm text-slate-400">현장 출근 관리</p>
        </div>

        <Card>
          {/* Mode toggle */}
          <Segmented
            full
            value={mode}
            onChange={(v) => setMode(v as "login" | "signup")}
            options={[
              { value: "login", label: "로그인" },
              { value: "signup", label: "회원가입" },
            ]}
            className="mb-5"
          />

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "signup" && (
              <Field label="이름">
                <TextInput
                  icon={<User size={16} />}
                  placeholder="이름을 입력하세요"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>
            )}

            <Field label="이메일">
              <TextInput
                type="email"
                icon={<Mail size={16} />}
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>

            <Field label="비밀번호">
              <TextInput
                type="password"
                icon={<Lock size={16} />}
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>

            <Button type="submit" full size="lg" className="mt-1">
              {mode === "login" ? "로그인" : "회원가입"}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">또는</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Kakao */}
          <Button
            variant="kakao"
            full
            size="lg"
            onClick={handleKakao}
            icon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9 1C4.582 1 1 3.895 1 7.445c0 2.244 1.414 4.212 3.552 5.34l-.902 3.347c-.08.296.265.53.51.353l4.03-2.706c.268.02.539.031.81.031 4.418 0 8-2.895 8-6.445C17 3.895 13.418 1 9 1z"
                  fill="#191600"
                />
              </svg>
            }
          >
            카카오로 {mode === "login" ? "로그인" : "가입"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
