import { Suspense } from "react";
import SigninForm from "@/component/auth/SigninForm";

const SignInPage = () => {
  return (
    <Suspense fallback={null}>
      <SigninForm />
    </Suspense>
  );
};

export default SignInPage;
