import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-lg">
            ACE
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">ACCE Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">
            Accra College of Education — sign in with your registered phone number
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <LoginForm />
        </div>
        <p className="text-xs text-slate-400 text-center mt-6">
          Lost access to your account, or new phone as a student? Ask your admin.
        </p>
      </div>
    </main>
  );
}
