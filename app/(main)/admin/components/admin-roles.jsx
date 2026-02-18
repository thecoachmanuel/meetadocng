"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import { upsertAdminUser } from "@/actions/admin";
import { toast } from "sonner";

const ADMIN_SECTIONS = [
	{ value: "pending", label: "Pending Verification" },
	{ value: "doctors", label: "Doctors" },
	{ value: "payouts", label: "Payouts" },
	{ value: "payments", label: "Payments" },
	{ value: "users", label: "Users" },
	{ value: "leaderboards", label: "Leaderboards" },
	{ value: "settings", label: "Site Settings" },
];

export default function AdminRolesPanel({ admins }) {
	const safeAdmins = Array.isArray(admins) ? admins : [];

	const [editingId, setEditingId] = useState(null);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [title, setTitle] = useState("");
	const [password, setPassword] = useState("");
	const [sections, setSections] = useState([]);

	const { loading, data, fn } = useFetch(upsertAdminUser);

	useEffect(() => {
		if (data?.success) {
			setPassword("");
			if (!editingId) {
				setName("");
				setEmail("");
				setTitle("");
				setSections([]);
			}
			toast.success("Admin settings saved");
		}
	}, [data, editingId]);

	const onToggleSection = (value) => {
		setSections((prev) => {
			if (prev.includes(value)) {
				return prev.filter((s) => s !== value);
			}
			return [...prev, value];
		});
	};

	const onEditAdmin = (admin) => {
		setEditingId(admin.id);
		setName(admin.name || "");
		setEmail(admin.email || "");
		setTitle(admin.adminTitle || "");
		setPassword("");
		setSections(Array.isArray(admin.adminSections) ? admin.adminSections : []);
	};

	const onResetForm = () => {
		setEditingId(null);
		setName("");
		setEmail("");
		setTitle("");
		setPassword("");
		setSections([]);
	};

	const onSubmit = async (e) => {
		e.preventDefault();
		const fd = new FormData();
		if (editingId) {
			fd.append("id", editingId);
		}
		fd.append("name", name);
		fd.append("email", email);
		fd.append("title", title);
		if (password) {
			fd.append("password", password);
		}
		sections.forEach((section) => {
			fd.append("sections", section);
		});
		try {
			await fn(fd);
		} catch (err) {
			toast.error(err.message);
		}
	};

	const mainAdmin = useMemo(
		() => safeAdmins.find((a) => a.isMainAdmin) || null,
		[safeAdmins],
	);

	return (
		<Card className="bg-muted/20 border-emerald-900/20">
			<CardHeader>
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
					<div>
						<CardTitle className="text-xl font-bold text-white">Admin Roles & Permissions</CardTitle>
						<p className="text-xs text-muted-foreground mt-1">
							Create additional admins and control which sections of the dashboard they can manage.
						</p>
					</div>
					{mainAdmin && (
						<div className="text-xs text-muted-foreground text-right">
							<p className="font-semibold text-emerald-400">Main admin</p>
							<p>{mainAdmin.email}</p>
							{mainAdmin.adminTitle && (
								<p className="text-[11px] mt-0.5">{mainAdmin.adminTitle}</p>
							)}
						</div>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				<form onSubmit={onSubmit} className="space-y-4">
					<div className="grid gap-3 md:grid-cols-2">
						<div className="space-y-1">
							<Label className="text-xs uppercase tracking-wide">Name</Label>
							<Input
								placeholder="Full name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="h-9 bg-background/60 border-emerald-900/40 text-sm"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs uppercase tracking-wide">Email</Label>
							<Input
								type="email"
								placeholder="admin@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="h-9 bg-background/60 border-emerald-900/40 text-sm"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs uppercase tracking-wide">Title / Role label</Label>
							<Input
								placeholder="e.g. Support admin, Finance admin"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								className="h-9 bg-background/60 border-emerald-900/40 text-sm"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs uppercase tracking-wide">
								Password {editingId ? <span className="text-muted-foreground">(leave blank to keep)</span> : null}
							</Label>
							<Input
								type="password"
								placeholder={editingId ? "Leave empty to keep current" : "Set a secure password"}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="h-9 bg-background/60 border-emerald-900/40 text-sm"
							/>
						</div>
					</div>

					<div className="space-y-2 pt-3 border-t border-emerald-900/30">
						<Label className="text-xs uppercase tracking-wide">Allowed sections</Label>
						<p className="text-[11px] text-muted-foreground">
							Select the areas of the admin dashboard this admin can access.
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-1">
							{ADMIN_SECTIONS.map((section) => {
								const active = sections.includes(section.value);
								return (
									<button
										key={section.value}
										type="button"
										onClick={() => onToggleSection(section.value)}
										className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs transition-colors ${
											active
												? "border-emerald-500 bg-emerald-900/40 text-emerald-100"
												: "border-emerald-900/40 bg-background/40 text-muted-foreground hover:border-emerald-600/60"
										}`}
									>
										<span>{section.label}</span>
										{active && (
											<span className="text-[10px] font-semibold text-emerald-300">ENABLED</span>
										)}
									</button>
								);
							})}
						</div>
					</div>

					<div className="flex items-center justify-between pt-2">
						<div className="text-[11px] text-muted-foreground">
							{editingId ? "Editing existing admin" : "Creating new admin"}
						</div>
						<div className="flex gap-2">
							{editingId && (
								<Button
									type="button"
									variant="outline"
									className="border-emerald-900/40"
									onClick={onResetForm}
								>
									Cancel edit
								</Button>
							)}
							<Button
								type="submit"
								className="bg-emerald-600 hover:bg-emerald-700"
								disabled={loading}
							>
								{loading ? "Saving..." : editingId ? "Save changes" : "Create admin"}
							</Button>
						</div>
					</div>
				</form>

				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
							Existing admins
						</p>
						<p className="text-[11px] text-muted-foreground">
							Total: {safeAdmins.length}
						</p>
					</div>
					{!safeAdmins.length ? (
						<p className="text-sm text-muted-foreground">
							You are currently the only admin on this workspace.
						</p>
					) : (
						<div className="space-y-2">
							{safeAdmins.map((admin) => (
								<div
									key={admin.id}
									className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-md border border-emerald-900/40 bg-background/40 px-3 py-2"
								>
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<p className="text-sm font-medium text-white">
												{admin.name || admin.email}
											</p>
											<p className="text-[11px] text-muted-foreground">{admin.email}</p>
											{admin.isMainAdmin && (
												<Badge className="h-5 px-2 text-[10px] bg-emerald-700/80">Main</Badge>
											)}
										</div>
										{admin.adminTitle && (
											<p className="text-[11px] text-emerald-300">{admin.adminTitle}</p>
										)}
										<div className="flex flex-wrap gap-1 mt-1">
											{(admin.adminSections || []).map((section) => {
												const meta = ADMIN_SECTIONS.find((s) => s.value === section);
												return (
													<Badge
														key={section}
														variant="outline"
														className="border-emerald-800/60 text-[10px]"
													>
														{meta?.label || section}
													</Badge>
												);
											})}
											{!admin.adminSections?.length && (
												<span className="text-[11px] text-muted-foreground">
													No sections assigned
												</span>
											)}
										</div>
									</div>
									<div className="flex items-center gap-2 self-start md:self-auto">
										<Button
											type="button"
											variant="outline"
											className="border-emerald-900/40 text-xs"
											onClick={() => onEditAdmin(admin)}
										>
											Edit
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

