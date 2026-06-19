import { useState } from "react";
import { Link } from "wouter";
import { Show, useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMyOrders,
  useGetMe,
  useUpdateMe,
  useListMyAddresses,
  useCreateMyAddress,
  useUpdateMyAddress,
  useDeleteMyAddress,
  getGetMeQueryKey,
  getListMyAddressesQueryKey,
} from "@workspace/api-client-react";
import type { SavedAddress } from "@workspace/api-client-react";
import {
  ShoppingBag,
  Package,
  User as UserIcon,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  Check,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function statusStyle(status: string) {
  switch (status.toLowerCase()) {
    case "paid":
      return "bg-primary/10 text-primary border-primary/20";
    case "shipped":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "cancelled":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

const inputClass =
  "w-full bg-white border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50 rounded-sm";
const labelClass =
  "block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2";

interface AddressForm {
  label: string;
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

const EMPTY_ADDRESS: AddressForm = {
  label: "",
  name: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
  isDefault: false,
};

function ProfileSection() {
  const { data: me } = useGetMe();
  const updateMe = useUpdateMe();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const startEdit = () => {
    setName(me?.name ?? "");
    setEditing(true);
  };

  const save = () => {
    updateMe.mutate(
      { data: { name: name.trim() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          setEditing(false);
          toast({ title: "Profile updated" });
        },
        onError: () => {
          toast({
            title: "Update failed",
            description: "Could not save your profile. Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <section className="border border-border rounded-3xl bg-white/70 backdrop-blur-sm p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UserIcon className="w-5 h-5 text-primary" strokeWidth={1.5} />
          <h2 className="font-display text-2xl text-foreground">Profile</h2>
        </div>
        {!editing && (
          <button
            onClick={startEdit}
            className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase text-primary hover:text-primary/80 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} /> Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-5">
          <div>
            <label className={labelClass}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              className={inputClass}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={updateMe.isPending}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold tracking-[0.2em] uppercase hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" strokeWidth={2} />
              {updateMe.isPending ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={2} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <dl className="space-y-4">
          <div>
            <dt className={labelClass}>Name</dt>
            <dd className="text-foreground font-light">
              {me?.name || (
                <span className="text-muted-foreground italic">Not set</span>
              )}
            </dd>
          </div>
          <div>
            <dt className={labelClass}>Email</dt>
            <dd className="text-foreground font-light">{me?.email}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onMakeDefault,
  busy,
}: {
  address: SavedAddress;
  onEdit: () => void;
  onDelete: () => void;
  onMakeDefault: () => void;
  busy: boolean;
}) {
  return (
    <div className="border border-border rounded-2xl bg-white/70 p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {address.label && (
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
              {address.label}
            </span>
          )}
          {address.isDefault && (
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Star className="w-2.5 h-2.5 fill-current" /> Default
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            aria-label="Edit address"
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
          >
            <Pencil className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={onDelete}
            disabled={busy}
            aria-label="Delete address"
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div className="text-sm text-foreground font-light leading-relaxed">
        <p className="font-medium">{address.name}</p>
        <p>{address.address1}</p>
        {address.address2 && <p>{address.address2}</p>}
        <p>
          {address.city}, {address.state} {address.zip}
        </p>
        <p>{address.country}</p>
      </div>
      {!address.isDefault && (
        <button
          onClick={onMakeDefault}
          disabled={busy}
          className="mt-4 self-start inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
        >
          <Star className="w-3 h-3" strokeWidth={1.5} /> Set as default
        </button>
      )}
    </div>
  );
}

function AddressForm({
  initial,
  onCancel,
  onSubmit,
  saving,
}: {
  initial: AddressForm;
  onCancel: () => void;
  onSubmit: (form: AddressForm) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<AddressForm>(initial);
  const update =
    (field: keyof AddressForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form
      onSubmit={submit}
      className="border border-primary/30 rounded-2xl bg-white p-6 space-y-5"
    >
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>Label</label>
          <input
            type="text"
            value={form.label}
            onChange={update("label")}
            placeholder="Home, Work…"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            Full Name <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={update("name")}
            placeholder="Jane Smith"
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>
          Address Line 1 <span className="text-primary">*</span>
        </label>
        <input
          type="text"
          required
          value={form.address1}
          onChange={update("address1")}
          placeholder="123 Main Street"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Address Line 2</label>
        <input
          type="text"
          value={form.address2}
          onChange={update("address2")}
          placeholder="Apt, Suite, Unit (optional)"
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>
            City <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            required
            value={form.city}
            onChange={update("city")}
            placeholder="Los Angeles"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            State <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            required
            value={form.state}
            onChange={update("state")}
            placeholder="CA"
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>
            ZIP Code <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            required
            value={form.zip}
            onChange={update("zip")}
            placeholder="90210"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            Country <span className="text-primary">*</span>
          </label>
          <select
            required
            value={form.country}
            onChange={update("country")}
            className={inputClass}
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
          </select>
        </div>
      </div>
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) =>
            setForm((f) => ({ ...f, isDefault: e.target.checked }))
          }
          className="w-4 h-4 accent-primary"
        />
        <span className="text-sm text-foreground font-light">
          Set as default shipping address
        </span>
      </label>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold tracking-[0.2em] uppercase hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Check className="w-4 h-4" strokeWidth={2} />
          {saving ? "Saving…" : "Save address"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" strokeWidth={2} /> Cancel
        </button>
      </div>
    </form>
  );
}

function AddressBook() {
  const { data, isLoading, isError } = useListMyAddresses();
  const createAddress = useCreateMyAddress();
  const updateAddress = useUpdateMyAddress();
  const deleteAddress = useDeleteMyAddress();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [mode, setMode] = useState<"list" | "new" | number>("list");

  const addresses = data?.data ?? [];
  const busy =
    createAddress.isPending ||
    updateAddress.isPending ||
    deleteAddress.isPending;

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: getListMyAddressesQueryKey() });

  const handleCreate = (form: AddressForm) => {
    createAddress.mutate(
      { data: { ...form, label: form.label || undefined } },
      {
        onSuccess: () => {
          refresh();
          setMode("list");
          toast({ title: "Address added" });
        },
        onError: () =>
          toast({
            title: "Could not add address",
            variant: "destructive",
          }),
      },
    );
  };

  const handleUpdate = (id: number, form: AddressForm) => {
    updateAddress.mutate(
      { id, data: { ...form, label: form.label || undefined } },
      {
        onSuccess: () => {
          refresh();
          setMode("list");
          toast({ title: "Address updated" });
        },
        onError: () =>
          toast({
            title: "Could not update address",
            variant: "destructive",
          }),
      },
    );
  };

  const handleDelete = (id: number) => {
    deleteAddress.mutate(
      { id },
      {
        onSuccess: () => {
          refresh();
          toast({ title: "Address removed" });
        },
        onError: () =>
          toast({
            title: "Could not remove address",
            variant: "destructive",
          }),
      },
    );
  };

  const handleMakeDefault = (id: number) => {
    updateAddress.mutate(
      { id, data: { isDefault: true } },
      {
        onSuccess: () => refresh(),
        onError: () =>
          toast({
            title: "Could not update default",
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <section className="border border-border rounded-3xl bg-white/70 backdrop-blur-sm p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-primary" strokeWidth={1.5} />
          <h2 className="font-display text-2xl text-foreground">
            Saved Addresses
          </h2>
        </div>
        {mode === "list" && (
          <button
            onClick={() => setMode("new")}
            className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} /> Add
          </button>
        )}
      </div>

      {isLoading && (
        <p className="text-muted-foreground font-light py-6">
          Loading addresses…
        </p>
      )}
      {isError && (
        <p className="text-destructive font-light py-6">
          Could not load your addresses.
        </p>
      )}

      {mode === "new" && (
        <AddressForm
          initial={EMPTY_ADDRESS}
          onCancel={() => setMode("list")}
          onSubmit={handleCreate}
          saving={createAddress.isPending}
        />
      )}

      {mode === "list" && !isLoading && !isError && (
        <>
          {addresses.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl">
              <MapPin
                className="w-8 h-8 mx-auto text-muted-foreground/50 mb-4"
                strokeWidth={1.2}
              />
              <p className="text-muted-foreground font-light mb-6">
                No saved addresses yet.
              </p>
              <button
                onClick={() => setMode("new")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold tracking-[0.2em] uppercase hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" strokeWidth={2} /> Add an address
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {addresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  busy={busy}
                  onEdit={() => setMode(address.id)}
                  onDelete={() => handleDelete(address.id)}
                  onMakeDefault={() => handleMakeDefault(address.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {typeof mode === "number" &&
        (() => {
          const target = addresses.find((a) => a.id === mode);
          if (!target) return null;
          return (
            <AddressForm
              initial={{
                label: target.label ?? "",
                name: target.name,
                address1: target.address1,
                address2: target.address2 ?? "",
                city: target.city,
                state: target.state,
                zip: target.zip,
                country: target.country,
                isDefault: target.isDefault,
              }}
              onCancel={() => setMode("list")}
              onSubmit={(form) => handleUpdate(target.id, form)}
              saving={updateAddress.isPending}
            />
          );
        })()}
    </section>
  );
}

function OrdersList() {
  const { data, isLoading, isError } = useGetMyOrders();
  const orders = data?.data ?? [];

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-5 h-5 text-primary" strokeWidth={1.5} />
        <h2 className="font-display text-2xl text-foreground">Order History</h2>
      </div>

      {isLoading && (
        <div className="text-muted-foreground font-light py-12 text-center">
          Loading your orders…
        </div>
      )}

      {isError && (
        <div className="text-destructive font-light py-12 text-center">
          We couldn't load your orders. Please try again later.
        </div>
      )}

      {!isLoading && !isError && orders.length === 0 && (
        <div className="text-center py-16 border border-border rounded-3xl bg-white/60">
          <Package
            className="w-10 h-10 mx-auto text-muted-foreground/60 mb-6"
            strokeWidth={1.2}
          />
          <p className="font-display text-3xl text-foreground mb-3">
            No orders yet
          </p>
          <p className="text-muted-foreground font-light mb-8">
            When you place an order, it will appear here.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold tracking-[0.2em] uppercase hover:bg-primary/90 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
            Shop the collection
          </Link>
        </div>
      )}

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border border-border rounded-3xl bg-white/70 backdrop-blur-sm p-6 md:p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-muted-foreground mb-1">
                  Order #{order.id}
                </p>
                <p className="text-sm text-muted-foreground font-light">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <span
                className={`text-[10px] font-semibold tracking-[0.2em] uppercase px-3 py-1.5 rounded-full border ${statusStyle(
                  order.status,
                )}`}
              >
                {order.status}
              </span>
            </div>

            <div className="space-y-3 border-t border-border pt-5">
              {(order.items ?? []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-sm text-foreground font-light">
                    {item.productName}
                    <span className="text-muted-foreground">
                      {" "}
                      × {item.quantity}
                    </span>
                  </span>
                  <span className="text-sm text-foreground tabular-nums">
                    {formatPrice(item.unitAmount * item.quantity, item.currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-border pt-5 mt-5">
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                Total
              </span>
              <span className="font-display text-2xl text-foreground tabular-nums">
                {formatPrice(order.totalAmount, order.currency)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AccountDashboard() {
  const { user } = useUser();

  return (
    <div className="container mx-auto px-4 lg:px-12 pt-40 pb-32 max-w-4xl">
      <div className="mb-12">
        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">
          Your Account
        </p>
        <h1 className="font-display text-5xl md:text-6xl text-foreground tracking-tight">
          My Account
        </h1>
        {user?.primaryEmailAddress?.emailAddress && (
          <p className="text-muted-foreground font-light mt-4">
            Signed in as {user.primaryEmailAddress.emailAddress}
          </p>
        )}
      </div>

      <div className="space-y-10">
        <ProfileSection />
        <AddressBook />
        <OrdersList />
      </div>
    </div>
  );
}

function SignedOutPrompt() {
  return (
    <div className="container mx-auto px-4 lg:px-12 pt-40 pb-32 max-w-2xl text-center">
      <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">
        Your Account
      </p>
      <h1 className="font-display text-5xl md:text-6xl text-foreground tracking-tight mb-6">
        Sign in to view your account
      </h1>
      <p className="text-muted-foreground font-light mb-10">
        Access your profile, saved addresses, and order history.
      </p>
      <Link
        href="/sign-in"
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold tracking-[0.2em] uppercase hover:bg-primary/90 transition-colors"
      >
        Sign in
      </Link>
    </div>
  );
}

export default function Account() {
  return (
    <>
      <Show when="signed-in">
        <AccountDashboard />
      </Show>
      <Show when="signed-out">
        <SignedOutPrompt />
      </Show>
    </>
  );
}
