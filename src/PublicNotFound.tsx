/**
 * Shown for root and unknown paths. Keep this admin-facing and avoid storefront redirects.
 */
export function PublicNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center text-zinc-300">
      <p className="text-lg font-semibold text-white">Admin access only</p>
      <p className="mt-2 max-w-md text-sm text-zinc-500">
        This URL is not a public storefront route. Use the admin path shared with staff.
      </p>
    </div>
  );
}
