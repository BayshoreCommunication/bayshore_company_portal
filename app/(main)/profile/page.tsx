import { getMyProfileAction } from "@/app/actions/profile";
import ProfileView from "@/component/profile/ProfileView";
import { formErrorBanner } from "@/component/shared/ui";

// The signed-in team member's own profile, read only. Editing lives on the settings page.
const ProfilePage = async () => {
  const profile = await getMyProfileAction();
  if (!profile) {
    return (
      <div className={formErrorBanner} role="alert">
        Could not load your profile. Please refresh the page to try again.
      </div>
    );
  }
  return <ProfileView profile={profile} />;
};

export default ProfilePage;
