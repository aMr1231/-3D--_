import { InfoFacts, InfoList, InfoSection, InfoTerms, PageInfo } from '@/components/info/PageInfo'
import { ROLE_ACCESS, ROLE_LABEL } from '@/domain/types'

/** Пояснения к управлению доступом: роли, хранимые данные и журнал. */
export function UsersInfo({ total, managers }: { total: number | null; managers: number }) {
  return (
    <PageInfo title="Пользователи">
      <InfoSection id="users" title="Доступ">
        <p>
          Новые пользователи регистрируются сами и получают роль «{ROLE_LABEL.guest}». Здесь руководитель выдаёт полный доступ или удаляет
          учётные записи.
        </p>
        {total !== null && (
          <InfoFacts
            items={[
              { label: 'Учётных записей', value: String(total) },
              { label: 'Руководителей', value: String(managers) },
            ]}
          />
        )}
      </InfoSection>

      <InfoSection id="roles" title="Роли">
        <InfoTerms
          items={[
            { term: ROLE_LABEL.manager, text: `${ROLE_ACCESS.manager}: обзор, двойник, сценарии, аналитика, 3D-тур и пользователи.` },
            { term: ROLE_LABEL.guest, text: `${ROLE_ACCESS.guest}.` },
          ]}
        />
        <p>Собственную роль изменить и свою учётную запись удалить нельзя. Зелёная точка у логина — пользователь в сети.</p>
      </InfoSection>

      <InfoSection id="privacy" title="Данные и безопасность">
        <InfoList
          items={[
            'Хранятся только логин, хеш пароля, роль и дата регистрации.',
            'Смена роли и удаление действуют сразу — без повторного входа; при удалении все сессии завершаются.',
            'Все проверки прав выполняются на сервере.',
          ]}
        />
      </InfoSection>

      <InfoSection id="audit" title="Журнал действий">
        <p>Входы, регистрации, смена ролей и паролей, удаления — последние 100 записей. Новые записи появляются без обновления страницы.</p>
      </InfoSection>
    </PageInfo>
  )
}
