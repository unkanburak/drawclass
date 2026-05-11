import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 px-6">
      <h1 className="text-5xl md:text-7xl font-bold text-rose-500 text-center drop-shadow-sm">
        ✏️ Sayı Çizme Sınıfı
      </h1>
      <p className="text-2xl text-slate-600 text-center max-w-xl">
        Bu cihazı kim kullanacak?
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        <Link
          href="/teacher"
          className="bg-sky-400 hover:bg-sky-500 active:scale-95 transition rounded-3xl p-10 text-white shadow-xl flex flex-col items-center gap-4"
        >
          <span className="text-7xl">🧑‍🏫</span>
          <span className="text-3xl font-bold">Öğretmen Paneli</span>
        </Link>
        <Link
          href="/student"
          className="bg-rose-400 hover:bg-rose-500 active:scale-95 transition rounded-3xl p-10 text-white shadow-xl flex flex-col items-center gap-4"
        >
          <span className="text-7xl">🎨</span>
          <span className="text-3xl font-bold">Öğrenci Cihazı</span>
        </Link>
      </div>
      <p className="text-slate-500 text-lg mt-4">
        Aynı ağdaki tablet/bilgisayardan{" "}
        <code className="bg-white px-2 py-1 rounded">http://&lt;bu-ip&gt;:3000</code>{" "}
        adresine bağlanabilirsiniz.
      </p>
    </main>
  );
}
