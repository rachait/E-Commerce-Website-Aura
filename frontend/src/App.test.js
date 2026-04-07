import { render, screen } from "@testing-library/react";
import App from "./App";

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve([
        { id: 1, name: "Aura Sneaker X1", price: 129.99, stock: 50 },
      ]),
  })
);

test("renders Aura eCommerce header", async () => {
  render(<App />);
  expect(screen.getByText(/Aura eCommerce/i)).toBeInTheDocument();
});

test("renders product after fetch", async () => {
  render(<App />);
  const product = await screen.findByText("Aura Sneaker X1");
  expect(product).toBeInTheDocument();
});
