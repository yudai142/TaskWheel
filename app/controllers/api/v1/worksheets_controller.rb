# frozen_string_literal: true

module Api
  module V1
    class WorksheetsController < BaseController
      def index
        worksheets = current_user.worksheets.order(created_at: :asc)
        render json: worksheets.map { |worksheet| serialize_worksheet(worksheet) }
      end

      def create
        deny_demo_user_modification! and return
        worksheet = current_user.worksheets.build(worksheet_params)
        if worksheet.save
          render json: serialize_worksheet(worksheet), status: :created
        else
          render json: { errors: worksheet.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def show
        worksheet = current_user.worksheets.find(params[:id])
        render json: serialize_worksheet(worksheet)
      end

      def update
        deny_demo_user_modification! and return
        worksheet = current_user.worksheets.find(params[:id])
        if worksheet.update(worksheet_params)
          render json: serialize_worksheet(worksheet), status: :ok
        else
          render json: { errors: worksheet.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        deny_demo_user_modification! and return
        worksheet = current_user.worksheets.find(params[:id])
        worksheet.destroy
        head :no_content
      end

      def set_current
        worksheet = current_user.worksheets.find(params[:worksheet_id])
        session[:current_worksheet_id] = worksheet.id
        render json: {
          current_worksheet: serialize_worksheet(worksheet)
        }
      end

      def importable
        # 現在のワークシート ID を取得
        current_ws_id = session[:current_worksheet_id]
        
        # 現在のユーザーのワークシート一覧を取得（現在選択中以外）
        worksheets = current_user.worksheets.order(:created_at)
        worksheets = worksheets.where.not(id: current_ws_id) if current_ws_id.present?
        
        render json: worksheets.map { |worksheet| serialize_worksheet(worksheet) }
      end

      private

      def worksheet_params
        params.require(:worksheet).permit(:name, :interval, :week_use, :week)
      end

      def serialize_worksheet(worksheet)
        {
          id: worksheet.id,
          name: worksheet.name,
          interval: worksheet.interval,
          week_use: worksheet.week_use,
          week: worksheet.week
        }
      end
    end
  end
end
