import { Switch, Route } from "wouter";
import Home from "@/pages/Home";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;