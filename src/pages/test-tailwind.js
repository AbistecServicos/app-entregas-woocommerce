// pages/test-tailwind.js
export default function TestTailwind() {
  return (
    <div className="bg-purple-600 text-white p-8 text-center">
      <h1 className="text-2xl font-bold">Teste Tailwind</h1>
      <p className="text-lg">Se isso estiver roxo, o Tailwind funciona!</p>
      <button className="bg-white text-purple-600 px-4 py-2 rounded mt-4">
        Botão de Teste
      </button>
    </div>
  );
}