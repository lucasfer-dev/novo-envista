import Link from "next/link";
import { LockKeyhole, MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react";
import styles from "./ProtectedFeatureGate.module.css";

type Feature = "social" | "messages";

const copy = {
  social: {
    eyebrow: "MODO PROTEGIDO",
    title: "Seu Social está pronto para ser liberado.",
    description:
      "Você pode continuar usando projetos, equipes, cursos, competições e o restante do Envista. Para acessar o Social, precisamos da confirmação de um responsável.",
    icon: Users,
  },
  messages: {
    eyebrow: "MODO PROTEGIDO",
    title: "Suas mensagens estão a uma verificação de distância.",
    description:
      "Continue explorando o Envista normalmente. As conversas ficam protegidas até a confirmação de um responsável.",
    icon: MessageCircle,
  },
} as const;

function Preview({ feature }: { feature: Feature }) {
  if (feature === "messages") {
    return (
      <div className={styles.previewGrid} aria-hidden="true">
        <div className={styles.fakeSidebar}>
          <span className={styles.fakeSearch} />
          {[1, 2, 3, 4].map((item) => (
            <div className={styles.fakeThread} key={item}>
              <span className={styles.fakeAvatar} />
              <span>
                <i />
                <b />
              </span>
            </div>
          ))}
        </div>
        <div className={styles.fakeConversation}>
          <span className={styles.fakeHeader} />
          <div className={styles.bubbles}>
            <i />
            <i />
            <i />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.socialPreview} aria-hidden="true">
      <div className={styles.fakeComposer}>
        <span className={styles.fakeAvatar} />
        <span className={styles.fakeComposerLine} />
      </div>
      {[1, 2, 3].map((item) => (
        <div className={styles.fakePost} key={item}>
          <div className={styles.fakePostHead}>
            <span className={styles.fakeAvatar} />
            <span>
              <i />
              <b />
            </span>
          </div>
          <span className={styles.fakeBodyLine} />
          <span className={styles.fakeBodyLineShort} />
          <div className={styles.fakePostActions} />
        </div>
      ))}
    </div>
  );
}

export default function ProtectedFeatureGate({
  feature,
  returnHref = "/home",
}: {
  feature: Feature;
  returnHref?: string;
}) {
  const item = copy[feature];
  const Icon = item.icon;
  const verifyHref = `/guardian?next=${encodeURIComponent(feature === "messages" ? "/messages" : "/social")}`;

  return (
    <section className={styles.wrap} aria-labelledby="protected-feature-title">
      <div className={styles.preview}>
        <Preview feature={feature} />
        <div className={styles.fade} />
      </div>

      <div className={styles.card}>
        <div className={styles.lockIcon}><LockKeyhole size={22} aria-hidden="true" /></div>
        <span className={styles.eyebrow}>{item.eyebrow}</span>
        <h1 id="protected-feature-title">{item.title}</h1>
        <p>{item.description}</p>

        <div className={styles.benefits}>
          <span><ShieldCheck size={16} aria-hidden="true" /> Seu perfil continua protegido</span>
          <span><Sparkles size={16} aria-hidden="true" /> A verificação libera esta área</span>
          <span><Icon size={16} aria-hidden="true" /> Nada do restante do Envista é perdido</span>
        </div>

        <div className={styles.actions}>
          <Link className={styles.primary} href={verifyHref}>Verificar responsável</Link>
          <Link className={styles.secondary} href={returnHref}>Continuar explorando</Link>
        </div>

        <small>
          O responsável não precisa criar perfil público, publicar projetos nem participar da rede social do Envista.
        </small>
      </div>
    </section>
  );
}
