import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-xl place-items-center px-6 py-16">
      <div className="card w-full p-6 text-center">
        <Compass className="mx-auto h-6 w-6 text-brand" aria-hidden="true" />
        <h1 className="mt-3 text-lg font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted">
          That link does not exist. The builder and your prompt library are one click away.
        </p>
        <Link href="/" className="btn-primary mt-5">
          Back to the builder
        </Link>
      </div>
    </main>
  );
}
