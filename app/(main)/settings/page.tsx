import { getMyProfileAction } from "@/app/actions/profile";
import SettingsDetails from "@/component/settings/SettingsDetails";
import { formErrorBanner } from "@/component/shared/ui";

// The signed-in team member's profile.
const SettingsPage = async () => {
  const profile = await getMyProfileAction();
  if (!profile) {
    return (
      <div className={formErrorBanner} role="alert">
        Could not load your profile. Please refresh the page to try again.
      </div>
    );
  }
  return <SettingsDetails profile={profile} />;
};

export default SettingsPage;
