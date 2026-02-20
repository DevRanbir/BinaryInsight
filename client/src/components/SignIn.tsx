
import { signIn } from "@/auth"
import { Button } from "./ui/button"

export function SignIn() {
    return (
        <form
            action={async () => {
                "use server"
                await signIn("github", { redirectTo: "/dashboard" })
            }}
            className="w-full"
        >
            <Button type="submit" className="w-full h-10">
                Sign in with GitHub
            </Button>
        </form>
    )
}
