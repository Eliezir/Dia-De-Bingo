import { createFileRoute } from '@tanstack/react-router'
export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="p-2 flex flex-col items-center justify-center h-screen">
      <h3 className="text-2xl font-bold">Bem vindo, hoje é dia de bingo!</h3>
      <p className="text-sm text-muted-foreground">
        Clique no botão abaixo para criar uma sala
      </p>
      {/* <Button>Criar Sala</Button> */}
    </div>
  )
}
