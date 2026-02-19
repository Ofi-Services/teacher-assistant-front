import { Construction, ArrowLeft } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { useNavigate } from "react-router-dom"

export default function WorkInProgress() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4 pb-8">
          {/* Icon Animation */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="relative bg-primary/10 p-6 rounded-full">
                <Construction className="w-16 h-16 text-primary" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-4xl font-bold">En desarrollo</CardTitle>
            <CardDescription className="text-lg">
              ¡Estamos construyendo algo increíble!
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Description */}
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Esta sección está en desarrollo. Nuestro equipo está trabajando para traerte 
              nuevas funciones y mejoras.
            </p>
            <p className="text-sm text-muted-foreground">
              ¡Vuelve pronto para ver en qué hemos estado trabajando!
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso de desarrollo</span>
              <span className="font-semibold text-primary">65%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: '65%' }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              variant="default" 
              className="flex-1"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate('/dashboard')}
            >
              Ir al inicio
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              ¿Tienes preguntas o sugerencias? Contacta a nuestro equipo de soporte.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}