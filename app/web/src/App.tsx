import { useEffect, useState } from "react";
import { api } from "./api";
import { auth } from "./auth";
import { isConfigured } from "./supabase";
import { Avatar, Button, Card, PhoneFrame, TopBar, type Tab } from "./ui";
import { Onboarding } from "./screens/Onboarding";
import { Home } from "./screens/Home";
import { CreateGroup } from "./screens/CreateGroup";
import { GroupScreen } from "./screens/GroupScreen";
import { EventProfileForm } from "./screens/EventProfile";
import { Profile } from "./screens/Profile";
import { PlanView } from "./screens/PlanView";
import type { Group, Plan, User } from "./types";

export default function App() {
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("home");
  const [prevTab, setPrevTab] = useState<Tab>("home");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [groupMode, setGroupMode] = useState<"detail" | "event">("detail");

  // restore Supabase session
  useEffect(() => {
    (async () => {
      try {
        if (isConfigured) {
          const u = await auth.getMyProfile().catch(() => null);
          if (u) setMe(u);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function login(u: User) {
    setMe(u);
    setTab("home");
  }
  async function logout() {
    await auth.signOut();
    setMe(null);
  }

  function openGroup(id: string) {
    setSelectedGroupId(id);
    setCreating(false);
    setGroupMode("detail");
    setTab("group");
  }
  function home() {
    setCreating(false);
    setGroupMode("detail");
    setSelectedGroupId(null);
    setTab("home");
  }

  if (loading)
    return (
      <PhoneFrame>
        <div className="flex-1 grid place-items-center text-muted">Loading…</div>
      </PhoneFrame>
    );

  if (!me)
    return (
      <PhoneFrame>
        {!isConfigured && (
          <div className="mx-5 mt-2 text-xs text-purple bg-purple/10 border border-purple/30 rounded-xl px-3 py-2 shrink-0">
            ⚠ Supabase not configured — set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY in web/.env, then restart the dev server.
          </div>
        )}
        <Onboarding onDone={login} />
      </PhoneFrame>
    );

  const showBack = tab === "profile" || (tab === "group" && (creating || groupMode === "event")) || (tab === "group" && selectedGroupId);

  function handleBack() {
    if (tab === "profile") { setTab(prevTab); return; }
    if (creating) { home(); return; }                                // New Group was opened from home → go home
    if (groupMode === "event") { setGroupMode("detail"); return; }   // event profile → back to group detail
    home();                                                          // viewing a group → go home
  }

  return (
    <PhoneFrame>
      <TopBar
        onBack={showBack ? handleBack : undefined}
        right={
          <button onClick={() => { setPrevTab(tab); setTab("profile"); }}>
            <Avatar name={me.username} className="bg-mint" />
          </button>
        }
      />

      {!isConfigured && (
        <div className="mx-5 mb-2 text-xs text-purple bg-purple/10 border border-purple/30 rounded-xl px-3 py-2 shrink-0">
          ⚠ Supabase not configured — set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY in web/.env, then restart.
        </div>
      )}

      {/* ---- HOME ---- */}
      {tab === "home" && (
        <Home
          me={me}
          onOpenGroup={openGroup}
          onCreateGroup={() => {
            setCreating(true);
            setGroupMode("detail");
            setSelectedGroupId(null);
            setTab("group");
          }}
        />
      )}

      {/* ---- GROUP ---- */}
      {tab === "group" &&
        (creating ? (
          <CreateGroup
            me={me}
            onCreated={(g: Group) => {
              setCreating(false);
              openGroup(g.id);
            }}
          />
        ) : !selectedGroupId ? (
          <GroupPicker me={me} onOpen={openGroup} onCreate={() => setCreating(true)} />
        ) : groupMode === "event" ? (
          <EventProfileForm me={me} groupId={selectedGroupId} onSubmitted={() => setGroupMode("detail")} />
        ) : (
          <GroupScreen me={me} groupId={selectedGroupId} onFillProfile={() => setGroupMode("event")} />
        ))}

      {/* ---- PROFILE ---- */}
      {tab === "profile" && <Profile me={me} onSaved={setMe} onLogout={logout} />}

      {/* ---- PLAN ---- */}
      {tab === "plan" && <PlanTab me={me} selectedGroupId={selectedGroupId} onOpen={openGroup} />}

    </PhoneFrame>
  );
}

/* group picker shown when GROUP tab opened with nothing selected */
function GroupPicker({ me, onOpen, onCreate }: { me: User; onOpen: (id: string) => void; onCreate: () => void }) {
  const [groups, setGroups] = useState<Group[]>([]);
  useEffect(() => {
    api.myGroups(me.username).then(setGroups).catch(() => setGroups([]));
  }, [me.username]);
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6">
      <h1 className="display text-3xl mb-4">Groups</h1>
      {groups.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-muted mb-4">No groups yet.</p>
          <Button onClick={onCreate}>CREATE A GROUP</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <button key={g.id} onClick={() => onOpen(g.id)} className="w-full text-left">
              <Card className="flex items-center justify-between">
                <div>
                  <div className="display text-xl">{g.name}</div>
                  <div className="text-muted text-sm">📍 {g.city}</div>
                </div>
                <span className={g.plan ? "text-lime text-sm font-bold" : "text-purple text-sm font-bold"}>
                  {g.plan ? "Plan ✦" : `${g.submitted}/${g.total}`}
                </span>
              </Card>
            </button>
          ))}
          <Button variant="ghost" onClick={onCreate}>
            + NEW GROUP
          </Button>
        </div>
      )}
    </div>
  );
}

/* PLAN tab — shows the selected group's plan, or all groups' plans */
function PlanTab({ me, selectedGroupId, onOpen }: { me: User; selectedGroupId: string | null; onOpen: (id: string) => void }) {
  const [group, setGroup] = useState<Group | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    api.myGroups(me.username).then(setGroups).catch(() => setGroups([]));
    if (selectedGroupId) api.getGroup(selectedGroupId).then(setGroup).catch(() => setGroup(null));
    else setGroup(null);
  }, [me.username, selectedGroupId]);

  if (group?.plan)
    return (
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6">
        <h1 className="display text-2xl mb-1">{group.name}</h1>
        <p className="text-muted text-sm mb-4">Saved plan</p>
        <PlanView groupId={group.id} plan={group.plan} onUpdated={(p: Plan) => setGroup({ ...group, plan: p })} />
      </div>
    );

  const withPlans = groups.filter((g) => g.plan);
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6">
      <h1 className="display text-3xl mb-4">Plans</h1>
      {withPlans.length === 0 ? (
        <Card className="text-center py-10">
          <span className="text-3xl">✦</span>
          <p className="text-muted mt-3">No plans yet. Open a group and submit event profiles — the plan auto-generates once everyone's in.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {withPlans.map((g) => (
            <button key={g.id} onClick={() => onOpen(g.id)} className="w-full text-left">
              <Card>
                <div className="display text-xl">{g.plan?.title || g.name}</div>
                <div className="text-muted text-sm">
                  {g.name} · {g.plan?.day} {g.plan?.time}
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
